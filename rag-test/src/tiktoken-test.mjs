import { getEncoding, getEncodingNameForModel } from 'js-tiktoken';

const modelName = 'gpt-4';
const encodingName = getEncodingNameForModel(modelName);
console.log(encodingName);

const encoding = getEncoding(encodingName);
console.log('apple', encoding.encode("apple").length);
console.log('pineapple', encoding.encode("pineapple").length);
console.log('苹果', encoding.encode("苹果").length);
console.log('吃饭', encoding.encode("吃饭").length);
console.log('一二三', encoding.encode("一二三").length);
