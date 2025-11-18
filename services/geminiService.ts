
import { GoogleGenAI, Type } from "@google/genai";
import { Order } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const orderSchema = {
    type: Type.OBJECT,
    properties: {
        orderId: { type: Type.STRING, description: "Número do pedido (Nº pedido)" },
        requester: { type: Type.STRING, description: "Nome do solicitante" },
        destinationSector: { type: Type.STRING, description: "Setor de destino" },
        items: {
            type: Type.ARRAY,
            description: "Lista de itens do pedido",
            items: {
                type: Type.OBJECT,
                properties: {
                    itemNo: { type: Type.STRING, description: "Número do item (Nº do Item)" },
                    code: { type: Type.STRING, description: "Código do produto" },
                    description: { type: Type.STRING, description: "Descrição completa do material" },
                    location: { type: Type.STRING, description: "Localização e lote (Local - Lote)" },
                    quantityOrdered: { type: Type.NUMBER, description: "Quantidade pedida (Pedida)" },
                    unit: { type: Type.STRING, description: "Unidade de embalagem (Emb.)" },
                },
                required: ["itemNo", "code", "description", "location", "quantityOrdered", "unit"],
            },
        },
    },
    required: ["orderId", "requester", "destinationSector", "items"],
};

export async function extractOrderDataFromFile(base64File: string, mimeType: string): Promise<Order> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are an intelligent document processing system. Analyze the provided document, which is a 'Nota de Saída de Material', and extract the order details.
      Identify the main order information and all the line items.
      Return the data in a structured JSON format that strictly adheres to the provided schema.
      - 'orderId' comes from 'Nº pedido'.
      - 'requester' comes from 'Solicitante'.
      - 'destinationSector' comes from 'Setor destino'.
      - For each item, extract 'itemNo' ('Nº do Item'), 'code' ('Código'), 'description' ('Material Descrição'), 'location' ('Local - Lote'), 'quantityOrdered' ('Pedida'), and 'unit' ('Emb.').
      - Convert numeric values like quantity to numbers, not strings.
    `;
    
    const imagePart = {
        inlineData: {
            data: base64File,
            mimeType: mimeType,
        },
    };
    
    const textPart = {
        text: prompt
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [textPart, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: orderSchema,
        },
    });

    const jsonString = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonString);
        return parsedJson as Order;
    } catch (error) {
        console.error("Failed to parse JSON response from Gemini:", jsonString);
        throw new Error("The AI returned an invalid data format.");
    }
}
