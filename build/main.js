"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
commander_1.program.version('0.0.1');
commander_1.program.command('abc').action(() => {
    console.log('abc!');
});
commander_1.program.command('xyz').action(() => {
    console.log('xyz!');
});
commander_1.program.parse(process.argv);
