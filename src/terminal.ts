export const terminal = {
  log: (...args: any) => {
    process.stdout.write(
      args.reduce((acc: string, item: any) => `${acc} ${item}`) + "\n",
      "utf-8"
    );
  }
};
export default terminal;
