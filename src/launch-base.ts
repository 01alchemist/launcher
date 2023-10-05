/**
 * Author : Nidin Vinayakan <01@01alchemist.com>
 */
const minimist = require("minimist");
const chalk = require("chalk");
import * as child_process from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import terminal from "./terminal";

const { cursorTo } = readline;
const { spawn } = child_process;
const { white: w, red: r, bgRed: bgR } = chalk;

type SpawnOptions = child_process.SpawnOptions;

interface Instance extends child_process.ChildProcess {
  name: string;
}

type ObjectMap = { [key: string]: string | any };

type LaunchMode = "program" | "cli";

type Options = {
  env?: string | string[];
  cmds?: string[];
  cwd?: string;
  mode?: LaunchMode;
  exitProcessOnClose?: boolean;
  silent?: boolean;
} & SpawnOptions;

const defaultOptions: ObjectMap = {
  mode: "program",
  stdio: "inherit",
  exitProcessOnClose: false,
};

const baseDir = process.cwd();
let envPath = `${baseDir}/env/${process.env.USER}.env`;
if (!fs.existsSync(envPath)) {
  envPath = `${baseDir}/.env`;
}
if (fs.existsSync(envPath)) {
  terminal.log(`Loading env vars from: ${envPath}`);

  require("dotenv").config({
    path: envPath,
  });
}

type MergedOption = { name: string; value: any };
type MergedOptions = MergedOption[];

function mergeValue(value1: any, value2: any) {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return [...value1, ...value2];
  } else if (typeof value1 === "object" && typeof value2 === "object") {
    return {
      ...value1,
      ...value2,
    };
  }
  return value2;
}
function mergeOptions(
  name: string,
  defaultOption: ObjectMap,
  option: ObjectMap,
  cliOption: ObjectMap
): MergedOption {
  let value;

  if (defaultOption) {
    value = defaultOption;
  }

  if (option) {
    value = mergeValue(value, option);
  }

  if (cliOption) {
    value = mergeValue(value, cliOption);
  }

  return {
    name,
    value,
  };
}

function getOptions(_options: ObjectMap = {}, args: string[] = []) {
  const cliArgs = minimist(args);
  const optionNames = Object.keys(defaultOptions)
    .concat(Object.keys(_options))
    .concat(Object.keys(cliArgs));

  const mergedOptions: MergedOptions = optionNames.map((optionName) => {
    return mergeOptions(
      optionName,
      defaultOptions[optionName],
      _options[optionName],
      cliArgs[optionName]
    );
  });
  const flattenOptions: Options = mergedOptions.reduce(
    (acc: ObjectMap, option) => {
      acc[option.name] = option.value;
      return acc;
    },
    {}
  );
  return flattenOptions;
}

const launcher = {
  instances: [] as Instance[],
  terminateAll: (signal: NodeJS.Signals) => {
    launcher.instances.forEach((_instance: Instance) => {
      terminal.log(
        `Terminating [${_instance.name}] instance.pid: ${_instance.pid}`
      );
      _instance.kill(signal || "SIGTERM");
    });
  },
};

export async function launch(_options: Options = {}): Promise<string> {
  const args = _options.mode === "cli" ? process.argv.slice(2) : [];
  const options = getOptions(_options, args);
  if (options.env) {
    const env =
      options.env instanceof Array ? options.env : options.env.split(",");
    env.forEach((element: string) => {
      const [key, value] = element.split("=");
      const isReference = value.indexOf("process.env.") > -1;
      process.env[key] = isReference ? process.env[value.slice(12)] : value;
    });
  }
  const cmds =
    options.cmds ||
    process.argv.slice(2).filter((arg) => arg.indexOf("--cwd") === -1);
  let cwd = baseDir;
  if (options.cwd) {
    cwd =
      options.cwd[0] === "/" ? options.cwd : path.resolve(baseDir, options.cwd);
  }

  if (!cmds || cmds.length === 0) {
    const isCli = options.mode === "cli";
    const title = "Oops 😬, Did you forgot to pass";
    if (isCli) {
      const message =
        r(
          `\n ${title} ${bgR(
            w(" program ")
          )}?. Please tell me, which program you want to launch!\n`
        ) + `\n   Example: launch echo "Hello World"\n`;
      terminal.log(message);
      process.exit(1);
    } else {
      const message =
        r(
          `${title} option ${bgR(
            w(" cmds ")
          )}?. Please tell me, which program you want to launch!\n`
        ) + `\n   Example: launch({cmds:["echo", "Hello World"]});\n`;
      throw new Error(message);
    }
  }

  if (!options.silent) {
    terminal.log(
      "###############################################################################################################"
    );
    terminal.log("#  🚀  Launching   : " + cmds.join(" "));
    terminal.log("#  📂  CWD         : " + cwd);
    terminal.log(
      "###############################################################################################################"
    );
  }
  const { stdio, shell } = options;

  const instance = <Instance>spawn(cmds[0], cmds.slice(1), {
    stdio,
    cwd,
    shell,
  });
  instance.name = cmds[0];

  launcher.instances.push(instance);

  function exit(signal: NodeJS.Signals) {
    if (instance) {
      cursorTo(process.stdout, 0);
      terminal.log(`Killing [${instance.name}] instance.pid: ${instance.pid}`);
      instance.kill(signal || "SIGTERM");
    }
  }

  process.on("SIGINT", <any>exit);

  return new Promise(function (resolve, reject) {
    let output = "";
    let lastErrorData = "";
    if (stdio !== "inherit") {
      if (instance.stdout) {
        instance.stdout.on("data", function (data) {
          const dataStr = data.toString();
          if (dataStr) {
            output += dataStr;
          }
        });
      }
      if (instance.stderr) {
        instance.stderr.on("data", function (data) {
          lastErrorData = data.toString();
        });
      }
    }
    instance.on("close", async (code) => {
      if (options.exitProcessOnClose) {
        terminal.log(`[${instance.name}] exit code:${code}`);
        process.exit(code ? code : undefined);
      } else {
        terminal.log(`[${instance.name}] exit code:${code}`);
        code === 0 ? resolve(output) : reject(lastErrorData);
      }
    });
  });
}

export default launch;
