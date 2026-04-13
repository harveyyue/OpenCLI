import { cli } from '@jackwener/opencli/registry';
import { flussGet, flussPost, flussDelete, getCluster, setCurrent, READ, WRITE } from './utils.js';

cli({
    ...READ,
    name: 'databases',
    description: 'List databases in a Fluss cluster',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
    ],
    columns: ['database'],
    func: async (args) => {
        const cluster = getCluster(args);
        const data = await flussGet(args, `/api/clusters/${encodeURIComponent(cluster)}/databases`);
        return data.map((name) => ({ database: name }));
    },
});

cli({
    ...WRITE,
    name: 'create-db',
    description: 'Create a database in a Fluss cluster',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'name', positional: true, required: true, help: 'Database name' },
        { name: 'ignoreIfExists', help: 'Ignore if database already exists (default: true)' },
        { name: 'comment', help: 'Database comment' },
    ],
    columns: ['field', 'value'],
    func: async (args) => {
        const cluster = getCluster(args);
        const body = {
            name: String(args.name),
            ignoreIfExists: args.ignoreIfExists !== undefined ? args.ignoreIfExists !== 'false' : true,
        };
        if (args.comment) body.comment = String(args.comment);
        await flussPost(args, `/api/clusters/${encodeURIComponent(cluster)}/databases`, body);
        return [
            { field: 'database', value: body.name },
            { field: 'status', value: 'created' },
        ];
    },
});

cli({
    ...WRITE,
    name: 'drop-db',
    description: 'Drop a database in a Fluss cluster',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'name', positional: true, required: true, help: 'Database name to drop' },
        { name: 'ignoreIfNotExists', help: 'Ignore if database does not exist (default: true)' },
        { name: 'cascade', help: 'Drop all tables in the database (default: false)' },
    ],
    columns: ['field', 'value'],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = String(args.name);
        const ignoreIfNotExists = args.ignoreIfNotExists !== 'false';
        const cascade = args.cascade === 'true';
        const params = `ignoreIfNotExists=${ignoreIfNotExists}&cascade=${cascade}`;
        await flussDelete(args, `/api/clusters/${encodeURIComponent(cluster)}/databases/${encodeURIComponent(db)}?${params}`);
        return [
            { field: 'database', value: db },
            { field: 'status', value: 'dropped' },
        ];
    },
});

cli({
    ...WRITE,
    name: 'use-db',
    description: 'Set default database for subsequent commands',
    args: [
        { name: 'name', positional: true, required: true, help: 'Database name to use as default' },
    ],
    columns: ['field', 'value'],
    func: async (args) => {
        const db = String(args.name);
        setCurrent({ db });
        return [{ field: 'database', value: db }];
    },
});
