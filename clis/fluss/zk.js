import { cli } from '@jackwener/opencli/registry';
import { flussGet, getCluster, READ } from './utils.js';

cli({
    ...READ,
    name: 'zk',
    description: 'Browse ZooKeeper nodes in Fluss cluster',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'cluster', help: 'Cluster name (env: FLUSS_CLUSTER)' },
        { name: 'path', positional: true, required: true, default: '/', help: 'ZooKeeper path to browse' },
    ],
    columns: ['type', 'name', 'value'],
    func: async (args) => {
        const cluster = getCluster(args);
        const zkPath = String(args.path || '/');
        const data = await flussGet(
            args,
            `/api/clusters/${encodeURIComponent(cluster)}/zookeeper?path=${encodeURIComponent(zkPath)}`,
        );

        const rows = [];
        rows.push({ type: 'path', name: 'path', value: data.path });
        if (data.dataString) {
            rows.push({ type: 'data', name: 'data', value: data.dataString });
        }
        if (data.stat) {
            rows.push({ type: 'stat', name: 'version', value: String(data.stat.version) });
            rows.push({ type: 'stat', name: 'dataLength', value: String(data.stat.dataLength) });
            rows.push({ type: 'stat', name: 'numChildren', value: String(data.stat.numChildren) });
        }
        for (const child of data.children || []) {
            rows.push({ type: 'child', name: child, value: `${zkPath === '/' ? '' : zkPath}/${child}` });
        }
        return rows;
    },
});
