import { cli } from '@jackwener/opencli/registry';
import { flussGet, getCluster, getDb, READ } from './utils.js';

cli({
    ...READ,
    name: 'tables',
    description: 'List tables in a Fluss database',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'db', help: 'Database name (reads from context if not set)' },
    ],
    columns: ['name', 'tableType'],
    func: async (args) => {
        const cluster = getCluster(args);
        const db = getDb(args);
        const data = await flussGet(args, `/api/clusters/${encodeURIComponent(cluster)}/databases/${encodeURIComponent(db)}/tables`);
        return data.map((t) => ({ name: t.name, tableType: t.tableType }));
    },
});

cli({
    ...READ,
    name: 'table-info',
    description: 'Get Fluss table schema and details',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'table', positional: true, required: true, help: 'Table name or db.table format' },
    ],
    columns: ['field', 'value'],
    func: async (args) => {
        const cluster = getCluster(args);
        const parts = String(args.table).split('.');
        let db, table;
        if (parts.length === 2) {
            [db, table] = parts;
        } else {
            db = getDb(args);
            table = parts[0];
        }
        const basePath = `/api/clusters/${encodeURIComponent(cluster)}/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}`;
        const data = await flussGet(args, basePath);
        const bucketsData = await flussGet(args, `${basePath}/buckets`);

        const rows = [
            { field: 'database', value: data.database },
            { field: 'table', value: data.table },
            { field: 'tableId', value: String(data.tableId) },
            { field: 'primaryKeys', value: (data.primaryKeys || []).join(', ') || '-' },
            { field: 'bucketKeys', value: (data.bucketKeys || []).join(', ') || '-' },
            { field: 'partitionKeys', value: (data.partitionKeys || []).join(', ') || '-' },
            { field: 'numBuckets', value: String(data.numBuckets) },
            { field: 'createdTime', value: new Date(data.createdTime).toISOString().replace('T', ' ').slice(0, 19) },
            { field: 'modifiedTime', value: new Date(data.modifiedTime).toISOString().replace('T', ' ').slice(0, 19) },
        ];

        if (data.columns?.length) {
            rows.push({ field: '--- columns ---', value: '' });
            for (const col of data.columns) {
                rows.push({ field: col.name, value: `${col.type}${col.nullable === false ? ' NOT NULL' : ''}` });
            }
        }

        if (data.properties && Object.keys(data.properties).length) {
            rows.push({ field: '--- properties ---', value: '' });
            for (const [k, v] of Object.entries(data.properties)) {
                rows.push({ field: k, value: String(v) });
            }
        }

        if (bucketsData.buckets?.length) {
            rows.push({ field: '--- buckets ---', value: '' });
            for (const b of bucketsData.buckets) {
                rows.push({ field: `bucket-${b.bucketId}`, value: `leader=${b.leader} replicas=${JSON.stringify(b.replicas)}` });
            }
        }

        if (bucketsData.assignments && Object.keys(bucketsData.assignments).length) {
            rows.push({ field: '--- assignments ---', value: '' });
            for (const [serverId, bucketIds] of Object.entries(bucketsData.assignments)) {
                rows.push({ field: `server-${serverId}`, value: (bucketIds || []).join(', ') });
            }
        }

        return rows;
    },
});
