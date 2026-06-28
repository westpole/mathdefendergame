import type { MathExpression } from './types';

export const MathGen = {
  getOperationForStage(stage: number): string[] {
    if (stage <= 4) return ['+'];
    if (stage <= 8) return ['-'];
    if (stage <= 12) return ['+', '-'];
    if (stage <= 16) return ['*'];
    if (stage <= 20) return ['/'];
    if (stage <= 24) return ['*', '/'];
    return ['+', '-', '*', '/'];
  },

  generate(stage: number): MathExpression {
    const ops = MathGen.getOperationForStage(stage);
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0, b = 0, res = 0;

    switch (op) {
      case '+':
        res = Math.floor(Math.random() * 99) + 1;
        a = Math.floor(Math.random() * res);
        b = res - a;
        break;
      case '-':
        a = Math.floor(Math.random() * 99) + 1;
        b = Math.floor(Math.random() * a);
        res = a - b;
        break;
      case '*':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * (99 / a));
        res = a * b;
        break;
      case '/':
        b = Math.floor(Math.random() * 10) + 1;
        res = Math.floor(Math.random() * (99 / b));
        a = res * b;
        if (a === 0 && Math.random() > 0.2) { a = b; res = 1; }
        break;
    }

    return { text: `${a} ${op} ${b}`, answer: res, op };
  },
};
