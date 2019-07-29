import * as child_process from "child_process";

/// <reference types="node" />
type SpawnOptions = child_process.SpawnOptions;
type LaunchMode = "program" | "cli";
type Options = {
  env?: string | string[];
  cmds?: string[];
  cwd?: string;
  mode?: LaunchMode;
  exitProcessOnClose?: boolean;
  silent?: boolean;
} & SpawnOptions;
export function launch(_options?: Options): Promise<string>;
export default launch;
