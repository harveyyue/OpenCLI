import { cli } from '@jackwener/opencli/registry';
import { flussGet, flussDelete, READ, WRITE } from './utils.js';

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

cli({
    ...READ,
    name: 'files',
    description: 'Browse file system via Fluss web',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'path', positional: true, default: '/', help: 'File path to browse' },
    ],
    columns: ['name', 'isDir', 'size', 'modificationTime'],
    func: async (args) => {
        const filePath = String(args.path || '/');
        const data = await flussGet(args, `/api/files?path=${encodeURIComponent(filePath)}`);

        return (data.files || []).map((f) => ({
            name: f.name,
            isDir: f.isDir ? 'dir' : 'file',
            size: f.isDir ? '-' : formatSize(f.size),
            modificationTime: new Date(f.modificationTime).toISOString().replace('T', ' ').slice(0, 19),
        }));
    },
});

cli({
    ...WRITE,
    name: 'rm-file',
    description: 'Delete a file or directory via Fluss web',
    args: [
        { name: 'server', help: 'Fluss web server URL (env: FLUSS_SERVER)' },
        { name: 'path', positional: true, required: true, help: 'File or directory path to delete' },
    ],
    columns: ['field', 'value'],
    func: async (args) => {
        const filePath = String(args.path);
        await flussDelete(args, `/api/files?path=${encodeURIComponent(filePath)}`);
        return [
            { field: 'path', value: filePath },
            { field: 'status', value: 'deleted' },
        ];
    },
});
