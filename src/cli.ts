#!/usr/bin/env node
import * as yargs from 'yargs';
import { NinePatcher } from './NinePatcher';

let options = yargs
    .usage('$0', 'ninepatcher, a tool to generate 9-patch images')
    .help('help', 'View help information about this tool.')
    .option('config', { type: 'string', description: 'A path to the current ' })
    .argv;

const ninePatcher = new NinePatcher();
ninePatcher.run(options as any);
