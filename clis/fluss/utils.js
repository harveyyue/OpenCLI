import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { CliError } from '@jackwener/opencli/errors';
import { Strategy } from '@jackwener/opencli/registry';

const DEFAULT_SERVER = 'http://localhost:8083';
const CONFIG_FILE = path.join(os.homedir(), '.fluss-config.json');

export function readConfig() {
    try {
        const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        return { clusters: raw.clusters || [], current: raw.current || {} };
    } catch {
        return { clusters: [], current: {} };
    }
}

export function writeConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function addCluster(entry) {
    const config = readConfig();
    const idx = config.clusters.findIndex(c => c.name === entry.name);
    if (idx >= 0) {
        config.clusters[idx] = entry;
    } else {
        config.clusters.push(entry);
    }
    config.current.cluster = entry.name;
    writeConfig(config);
}

export function setCurrent(updates) {
    const config = readConfig();
    if (updates.cluster !== undefined) config.current.cluster = updates.cluster;
    if (updates.db !== undefined) config.current.db = updates.db;
    writeConfig(config);
}

export function getServer(args) {
    return String(args.server || process.env.FLUSS_SERVER || DEFAULT_SERVER);
}

export function getCluster(args) {
    const cluster = args.cluster || process.env.FLUSS_CLUSTER || readConfig().current.cluster;
    if (!cluster) throw new CliError('MISSING_CLUSTER', 'Cluster is required', 'Use --cluster <name>, set FLUSS_CLUSTER env, or run: opencli fluss cluster-add');
    return String(cluster);
}

export function getDb(args) {
    const db = args.db || readConfig().current.db;
    if (!db) throw new CliError('MISSING_DB', 'Database is required', 'Use --db <name> or run: opencli fluss use <db>');
    return String(db);
}

async function flussRequest(server, method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const resp = await fetch(`${server}${path}`, opts);
    if (resp.status === 204) return null;
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new CliError('API_ERROR', `Fluss API HTTP ${resp.status}: ${text}`, 'Check server URL and parameters');
    }
    const json = await resp.json();
    if (json.code !== undefined && json.code !== 0 && json.code !== 200) {
        throw new CliError('API_ERROR', json.message || `Error ${json.code}`, 'Check parameters');
    }
    return json.data !== undefined ? json.data : json;
}

export async function flussGet(args, path) {
    return flussRequest(getServer(args), 'GET', path);
}

export async function flussPost(args, path, body) {
    return flussRequest(getServer(args), 'POST', path, body);
}

export async function flussDelete(args, path) {
    return flussRequest(getServer(args), 'DELETE', path);
}

export const READ = { site: 'fluss', strategy: Strategy.PUBLIC, browser: false, access: 'read' };
export const WRITE = { site: 'fluss', strategy: Strategy.PUBLIC, browser: false, access: 'write' };
