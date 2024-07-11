# Nodejs Process Launcher
## Usage
```ts
import {launch} from '@01/launcher'

await launch({
  cmds:['echo', 'Hello']
})

```

## Options
```ts
type Options = {
  env?: string | string[];
  cmds?: string[];
  cwd?: string;
  mode?: LaunchMode;
  exitProcessOnClose?: boolean;
  silent?: boolean;
} & SpawnOptions;
```
### env
Option to pass custom environment variable to child process.
- `env:'ENV_VAR=value'`
- `env:['ENV1=v1', 'ENV2=v2']`
- `env:'ENV1=v1,ENV2=v2'`
### cmds
Child process cmd with arguments. First element is the program location or name and remaining elements are it's arguments.
```
cmds: ['echo', 'Hello']
```
### cwd
Current working directory. Path is absolute if it's starts with slash `/` otherwise relative.
- `cwd: './relative/path'`
- `cwd: '/absolute/path'`
### mode
Launch mode
- `cli` Exit program on exceptions
- `program` Throw error on exceptions
### exitProcessOnClose
Exit parent node process on close.
### silent
Skip verbose logs
