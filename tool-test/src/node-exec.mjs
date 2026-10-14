import { spawn } from 'node:child_process';
// spawn可以指定在cwd这个目录下执行命令，会创建一个子进程来跑，这也是为啥这个模块叫child_process。

// const command = 'ls -la'; // 要执行的命令，多个命令用空格分开，后面解析根据空格进行分割
const command = 'echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts'; // 要执行的命令，多个命令用空格分开，后面解析根据空格进行分割
const cwd = process.cwd();

// 解析命令和参数
const [cmd, ...args] = command.split(' ');

const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',//实时输出到控制台，inherit就是这个子进程的stdout也输出到父进程的stdout，也就是控制台。
    shell: true,
});

let errorMsg;

child.on('error', (error) => {
    errorMsg = error.message;
});

child.on('close', (code) => {
    if (code === 0) {
        process.exit(0);
    } else {
        if (errorMsg) {
            console.error(`错误: ${errorMsg}`);
            process.exit(code || 1);
        }
    }
});