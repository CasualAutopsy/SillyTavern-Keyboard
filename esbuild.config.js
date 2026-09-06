import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/index.js'],
    external: [
        '/script.js',
        '/scripts/slash-commands/SlashCommandClosure.js',
        '/scripts/slash-commands/SlashCommandScope.js',
        '/scripts/utils.js',
        '/scripts/extensions/quick-reply/index.js',
    ],
    bundle: true,
    format: 'esm',
    target: 'es2022',
    outfile: 'lib/index.js',
});
