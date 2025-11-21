
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
    async getUsers(): Promise<User[]> {
        if (!isSupabaseConfigured()) return [];
        
        const { data, error } = await supabase!
            .from('app_users')
            .select('*');

        if (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }

        return data.map((u: any) => ({
            id: u.id, // UUID do supabase
            name: u.name,
            role: u.role
        }));
    },

    async saveUser(user: User): Promise<void> {
        if (!isSupabaseConfigured()) return;

        // Se o ID não for um UUID válido (ex: gerado localmente como 'user1'), 
        // deixamos o Supabase gerar um novo removendo o ID do payload se for novo insert
        // ou mantemos se for update de um existente.
        // Para simplificar, vamos fazer upsert baseado no nome ou tentar usar o ID se for UUID
        
        const payload = {
            id: user.id.length > 10 ? user.id : undefined, // Tenta usar o ID se parecer um UUID
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

        // Busca pedidos e seus itens relacionados
        const { data: orders, error } = await supabase!
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Erro ao buscar pedidos:', error);
            throw error;
        }

        return orders.map((o: any) => mapOrderFromDB(o, o.items));
    },

    async createOrder(order: Order): Promise<void> {
        if (!isSupabaseConfigured()) return;

        // 1. Inserir Cabeçalho do Pedido
        const { data: newOrderData, error: orderError } = await supabase!
            .from('orders')
            .insert({
                order_id: order.orderId,
                requester: order.requester,
                destination_sector: order.destinationSector,
                status: order.status,
                timestamp: order.timestamp,
                picked_items: order.pickedItems || [],
                // separator_name e confirmer_name são nulos na criação
            })
            .select()
            .single();

        if (orderError) {
            console.error('Erro ao criar pedido:', orderError);
            throw orderError;
        }

        // 2. Preparar e Inserir Itens
        if (order.items && order.items.length > 0) {
            const itemsPayload = order.items.map(item => ({
                order_record_id: newOrderData.id, // Chave estrangeira gerada pelo banco
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
                // Idealmente faríamos rollback aqui, mas supabse-js básico não tem transação manual simples
                throw itemsError;
            }
        }
    },

    async updateOrder(order: Order): Promise<void> {
        if (!isSupabaseConfigured()) return;

        // Precisamos encontrar o registro interno (UUID) baseado no orderId e timestamp 
        // ou confiar que a UI passou o objeto atualizado. 
        // O jeito mais seguro no nosso schema atual (onde orderId pode repetir em datas diferentes)
        // é usar o update buscando pela chave composta ou assumir que temos o ID se ele viesse do getOrders.
        // Como nosso Order type não tem o ID interno do banco, vamos buscar pelo ID do pedido + timestamp
        
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
