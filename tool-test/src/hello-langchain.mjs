import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

console.log('🌛dotenv', process.env.MODEL_NAME);
console.log('🌛dotenv', process.env.OPENAI_API_KEY);
console.log('🌛dotenv', process.env.OPENAI_BASE_URL);

const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
})

const response = await model.invoke("Hello, 你是谁?")
console.log('🌛', response, response.content)