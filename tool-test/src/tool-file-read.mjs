// 我做了environment变量配置，所以这么引入即可，没做变量配置的话，后面的env可以自行写死自己的大模型配置
import "dotenv/config";

// 运行前先install依赖：npm install @langchain/openai @langchain/core zod
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import z from "zod";
/* 
    具体的消息有四种:SystemMessage、HumanMessage、AIMessage、ToolMessage
    ·SystemMessage:设置AI是谁，可以干什么，有什么能力，以及一些回答、行为的规范等
    ·HumanMessage:用户输入的信息
    ·AIMessage:AI的回复信息
    ·ToolMessage:调用工具的结果返回
    我们用systemmessage告诉ai，它是一个代码助手，可以读取文件并解释代码内容，给出建议
*/

import fs from "node:fs/promises";

// 首先创建一个 ChatOpenAI 实例，配置模型名称、API 密钥和基础 URL
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0, // 设置温度为0，确保输出更确定和一致
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
})

// 创建一个工具，用于读取文件内容
const readFileTool = tool(
    async ( filePath ) => {
        const content = await fs.readFile(filePath, "utf8");
        return `文件内容如下:\n${content}`;
    },
    {
        name: "read_file",
        description: "用词工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）",
        argsSchema: z.object({
            filePath: z.string().describe("要读取的文件路径"),
        }),
    }
)

const tools = [readFileTool];

// 把这个tool传给大模型
const modelWithTools = model.bindTools(tools);

// 创建一个系统消息，告诉模型如何使用工具
const messages = [
    new SystemMessage(`
        你是一个代码助手，可以使用工具读取文件并解释代码。
        工作流程:
            1.用户要求读取文件时，立即调用 read_file 工具
            2.等待工具返回文件内容
            3.基于文件内容进行分析和解释
        可用工具:
            read_file:读取文件内容(使用此工具来获取文件内容)
    `),
    new HumanMessage("读取 src/node-exec.mjs 文件内容，并解释代码"),
];

let response = await modelWithTools.invoke(messages);

// 把ai返回的消息也放到Messages数组中，方便后续继续对话
messages.push(response);

// 如果ai返回的消息中包含工具调用的内容，则需要解析工具调用的结果
while (response.tool_calls && response.tool_calls.length > 0) {

    const toolResults = await Promise.all(
        // ai返回的消息里有解析的回答tool_calls，我们遍历它，并调用对应的工具
        response.tool_calls.map(async (toolCall) => {
            const tool = tools.find((t) => t.name === toolCall.name);
            if (!tool) {
                throw new Error(`未找到工具: ${toolCall.name}`);
            }
            try {
                const result = await tool.invoke(toolCall.args);
                return { name: toolCall.name, result };
            } catch (error) {
                console.error(`工具调用失败: ${toolCall.name}`, error);
                return { name: toolCall.name, result: `工具调用失败: ${error.message}` };
            }
        })
    );

    // 把工具调用的结果添加到Messages数组中
    response.tool_calls.forEach((toolCall, index) => {
        const toolResult = toolResults[index];
        messages.push(new ToolMessage({
            content: toolResult.result,
            tool_call_id: toolCall.id,
        }));
    });

    // 继续调用模型，传入更新后的Messages数组
    response = await modelWithTools.invoke(messages);
    messages.push(response);
}   

// 最后输出ai返回的结果
console.log('🌛-最终回复结果:', response.content);