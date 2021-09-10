import { program } from 'commander';

program.version('0.0.1');

program.command('abc').action(() => {
    console.log('abc!')
})

program.command('xyz').action(() => {
    console.log('xyz!')
})


program.parse(process.argv);