
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Order, OrderItem, User } from '../types';

// Helper para converter snake_case do banco para camelCase da aplicação
const mapOrderFromDB = (dbOrder: any, dbItems: any[]): Order => {
    return {
        orderId: dbOrder.order_id,
        requester: dbOrder.requester,
        destinationSector: dbOrder.destination_sector,
        status: dbOrder.status,
        timestamp: dbOrder.timestamp,
        completionTimestamp: dbOrder.completion_timestamp,
        pickedItems: dbOrder.picked_items || [],
        completionStatus: dbOrder.completion_status,
        separator: dbOrder.separator_name, // Ajustado para bater com o schema SQL
        confirmer: dbOrder.confirmer_name, // Ajustado para bater com o schema SQL
        cancellationReason: dbOrder.cancellation_reason,
        items: dbItems.map(item => ({
            itemNo: item.item_no,
            code: item.code,
            description: item.description,
            location: item.location,
            quantityOrdered: item.quantity_ordered,
            unit: item.unit
        }))
    };
};

export const supabaseService = {
    async getCurrentUserProfile(): Promise<User | null> {
        if (!isSupabaseConfigured()) return null;

        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return null;

        // Tenta buscar o perfil existente
        const { data: profile, error } = await supabase!
            .from('app_users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(); 
        
        if (profile) {
            return {
                id: profile.id,
                name: profile.name,
                role: profile.role
            };
        }

        // Fallback: Cria perfil de Visualizador (Viewer) se não existir
        console.warn('Perfil não encontrado. Criando perfil de fallback (Viewer) para:', user.email);
        
        const fallbackName = user.user_metadata.name || user.email?.split('@')[0] || 'Visualizador';
        const fallbackRole = 'viewer'; 

        const { error: insertError } = await supabase!
            .from('app_users')
            .insert({
                id: user.id,
                name: fallbackName,
                role: fallbackRole
            });

        if (insertError) {
            console.error('Falha crítica ao criar perfil de fallback:', insertError);
            return { id: user.id, name: fallbackName, role: fallbackRole };
        }

        return {
            id: user.id,
            name: fallbackName,
            role: fallbackRole
        };
    },

    async signIn(email: string, password: string) {
        if (!isSupabaseConfigured()) return { data: null, error: { message: "Supabase não configurado" } };
        return await supabase!.auth.signInWithPassword({ email, password });
    },

    async signUp(email: string, password: string, name: string) {
        if (!isSupabaseConfigured()) return { data: null, error: { message: "Supabase não configurado" } };
        
        // 1. Criar usuário no Auth
        const { data, error } = await supabase!.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) return { data, error };

        // 2. Garantir que o perfil 'app_users' seja criado como VIEWER
        if (data.user) {
             const { error: profileError } = await supabase!
                .from('app_users')
                .upsert({
                    id: data.user.id,
                    name: name,
                    role: 'viewer' // Todo cadastro via tela de login é apenas visualizador
                }, { onConflict: 'id' });
            
            if (profileError) {
                console.warn("Erro ao criar perfil de visualizador:", profileError);
            }
        }

        return { data, error: null };
    },

    async signOut() {
        if (!isSupabaseConfigured()) return;
        await supabase!.auth.signOut();
    },

    // Retorna APENAS a equipe operacional (Separadores e Conferentes)
    // Exclui os 'viewers' (usuários de login)
    async getUsers(): Promise<User[]> {
        if (!isSupabaseConfigured()) return [];
        
        const { data, error } = await supabase!
            .from('app_users')
            .select('*')
            .in('role', ['separator', 'confirmer']); // Filtra apenas equipe operacional

        if (error) {
            console.error('Erro ao buscar equipe:', error);
            return [];
        }

        return data.map((u: any) => ({
            id: u.id, 
            name: u.name,
            role: u.role
        }));
    },

    async saveUser(user: User): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const payload = {
            id: user.id.length > 10 ? user.id : undefined,
            name: user.name,
            role: user.role
        };

        const { error } = await supabase!
            .from('app_users')
            .upsert(payload);

        if (error) throw error;
    },

    async deleteUser(userId: string): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const { error } = await supabase!
            .from('app_users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    },

    async getOrders(): Promise<Order[]> {
        if (!isSupabaseConfigured()) return [];

        const { data: orders, error } = await supabase!
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Erro ao buscar pedidos:', error);
            return [];
        }

        return orders.map((o: any) => mapOrderFromDB(o, o.items));
    },

    async createOrder(order: Order): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const { data: newOrderData, error: orderError } = await supabase!
            .from('orders')
            .insert({
                order_id: order.orderId,
                requester: order.requester,
                destination_sector: order.destinationSector,
                status: order.status,
                timestamp: order.timestamp,
                picked_items: order.pickedItems || [],
            })
            .select()
            .single();

        if (orderError) {
            console.error('Erro ao criar pedido:', orderError);
            throw orderError;
        }

        if (order.items && order.items.length > 0) {
            const itemsPayload = order.items.map(item => ({
                order_record_id: newOrderData.id,
                item_no: item.itemNo,
                code: item.code,
                description: item.description,
                location: item.location,
                quantity_ordered: item.quantityOrdered,
                unit: item.unit
            }));

            const { error: itemsError } = await supabase!
                .from('order_items')
                .insert(itemsPayload);

            if (itemsError) {
                console.error('Erro ao criar itens:', itemsError);
                throw itemsError;
            }
        }
    },

    async updateOrder(order: Order): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const payload = {
            status: order.status,
            picked_items: order.pickedItems,
            completion_status: order.completionStatus,
            separator_name: order.separator,
            confirmer_name: order.confirmer,
            completion_timestamp: order.completionTimestamp,
            cancellation_reason: order.cancellationReason
        };

        const { error } = await supabase!
            .from('orders')
            .update(payload)
            .eq('order_id', order.orderId)
            .eq('timestamp', order.timestamp);

        if (error) throw error;
    }
};
