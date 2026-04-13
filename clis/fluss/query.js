import { CliError } from '@jackwener/opencli/errors';
import { cli } from '@jackwener/opencli/registry';
import { flussPost, getCluster, getDb, READ } from './utils.js';

cli({
    ...READ,
    name: 'scan',
    description: 'Scan Fluss table data with limit',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'db', help: 'Database name (reads from context if not set)' },
        { name: 'table', positional: true, required: true, help: 'Table name' },
        { name: 'limit', type: 'int', default: 20, help: 'Max rows to return' },
    ],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = getDb(args);
        const data = await flussPost(
            args,
            `/api/clusters/${encodeURIComponent(cluster)}/query/limit-scan`,
            { database: db, table: String(args.table), limit: Number(args.limit) || 20 },
        );
        return data.rows || [];
    },
});

cli({
    ...READ,
    name: 'lookup',
    description: 'Point lookup by primary key in Fluss table',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'db', help: 'Database name (reads from context if not set)' },
        { name: 'table', positional: true, required: true, help: 'Table name' },
        { name: 'keys', required: true, help: 'Primary key values as JSON (e.g. \'{"id":1}\')' },
    ],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = getDb(args);
        let keys;
        try {
            keys = JSON.parse(String(args.keys));
        } catch {
            throw new CliError('INVALID_JSON', 'Invalid JSON for --keys', 'Example: --keys \'{"id":1}\'');
        }
        const data = await flussPost(
            args,
            `/api/clusters/${encodeURIComponent(cluster)}/query/lookup`,
            { database: db, table: String(args.table), keys },
        );
        return data.rows || [];
    },
});

cli({
    ...READ,
    name: 'fetch-log',
    description: 'Fetch log records from Fluss table',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'db', help: 'Database name (reads from context if not set)' },
        { name: 'table', positional: true, required: true, help: 'Table name' },
        { name: 'bucket', type: 'int', default: 0, help: 'Bucket number' },
        { name: 'offset', type: 'int', default: 0, help: 'Start offset' },
        { name: 'limit', type: 'int', default: 20, help: 'Max records to return' },
        { name: 'partition', help: 'Partition name (optional)' },
    ],
    columns: ['offset', 'timestamp', 'changeType', 'row'],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = getDb(args);
        const body = {
            database: db,
            table: String(args.table),
            bucket: Number(args.bucket) || 0,
            offset: Number(args.offset) || 0,
            limit: Number(args.limit) || 20,
        };
        if (args.partition) body.partition = String(args.partition);

        const data = await flussPost(
            args,
            `/api/clusters/${encodeURIComponent(cluster)}/query/fetch-log`,
            body,
        );

        return (data.records || []).map((r) => ({
            offset: r.offset,
            timestamp: new Date(r.timestamp).toISOString().replace('T', ' ').slice(0, 19),
            changeType: r.changeType,
            row: JSON.stringify(r.row),
        }));
    },
});

cli({
    ...READ,
    name: 'row-count',
    description: 'Get row count of a Fluss table',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'db', help: 'Database name (reads from context if not set)' },
        { name: 'table', positional: true, required: true, help: 'Table name' },
    ],
    columns: ['table', 'rowCount'],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = getDb(args);
        const data = await flussPost(
            args,
            `/api/clusters/${encodeURIComponent(cluster)}/query/row-count`,
            { database: db, table: String(args.table) },
        );
        return [{ database: db, table: String(args.table), rowCount: data.rowCount }];
    },
});
