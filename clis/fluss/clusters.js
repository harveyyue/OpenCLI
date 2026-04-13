import { cli } from '@jackwener/opencli/registry';
import { addCluster, flussGet, flussPost, readConfig, setCurrent, READ, WRITE } from './utils.js';

cli({
    ...READ,
    name: 'clusters',
    description: 'List all Fluss clusters',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
    ],
    columns: ['name', 'bootstrapServers', 'connected'],
    func: async (args) => {
        const data = await flussGet(args, '/api/clusters');
        return data.map(c => ({
            name: c.name,
            bootstrapServers: c.bootstrapServers,
            connected: c.connected ? 'yes' : 'no',
        }));
    },
});

cli({
    ...WRITE,
    name: 'set-cluster',
    description: 'Add a Fluss cluster and set it as current',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'name', positional: true, required: true, help: 'Cluster name' },
        { name: 'bootstrap', positional: true, required: true, help: 'Bootstrap servers (e.g. localhost:9123)' },
    ],
    columns: ['name', 'bootstrapServers', 'connected'],
    func: async (args) => {
        const name = String(args.name);
        const bootstrapServers = String(args.bootstrap);
        const data = await flussPost(args, '/api/clusters', {
            name,
            bootstrapServers,
        });
        addCluster({ name, bootstrapServers });
        return data.map(c => ({
            name: c.name,
            bootstrapServers: c.bootstrapServers,
            connected: c.connected ? 'yes' : 'no',
        }));
    },
});

cli({
    ...WRITE,
    name: 'use-cluster',
    description: 'Set cluster as current context',
    args: [
        { name: 'name', positional: true, required: true, help: 'Database name to use as default' },
    ],
    columns: ['field', 'value'],
    func: async (args) => {
        const cluster = String(args.name);
        setCurrent({ cluster });
        return [{ field: 'cluster', value: cluster }];
    },
});

cli({
    ...READ,
    name: 'get-contexts',
    description: 'Show current Fluss context and saved clusters',
    args: [],
    columns: ['field', 'value'],
    func: async () => {
        const config = readConfig();
        return [
            {field: 'cluster', value: config.current.cluster || '(not set)'},
            {field: 'db', value: config.current.db || '(not set)'},
        ];
    },
});
