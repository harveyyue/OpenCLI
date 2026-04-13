import { cli } from '@jackwener/opencli/registry';
import { flussPost, getCluster, getDb, WRITE } from './utils.js';

cli({
    ...WRITE,
    name: 'sql',
    description: 'Execute SQL/DDL statements on Fluss',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'db', help: 'Database name (reads from context if not set)' },
        { name: 'sql', positional: true, required: true, help: 'SQL statement to execute' },
    ],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = getDb(args);
        const data = await flussPost(
            args,
            `/api/clusters/${encodeURIComponent(cluster)}/databases/${encodeURIComponent(db)}/ddl`,
            { ddl: String(args.sql) },
        );

        if (!data) return [{ result: 'OK' }];
        if (Array.isArray(data)) return data;
        if (data.rows && Array.isArray(data.rows)) return data.rows;
        if (data.results && Array.isArray(data.results)) return data.results;

        for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val) && val.length > 0) {
                if (typeof val[0] === 'object') return val;
                return val.map((v, i) => ({ index: i + 1, [key.replace(/s$/, '')]: v }));
            }
        }

        if (typeof data === 'object') {
            return Object.entries(data).map(([k, v]) => ({ field: k, value: String(v) }));
        }

        return [{ result: 'OK' }];
    },
});
