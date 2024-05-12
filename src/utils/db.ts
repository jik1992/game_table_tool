import {openDB} from 'idb';

const dbPromise = openDB('map-store', 1, {
    upgrade(db) {
        db.createObjectStore('owner');
    },
});

export async function get(key: any) {
    return (await dbPromise).get('owner', key);
}

export async function set(key: any, val: any) {
    return (await dbPromise).put('owner', val, key);
}

export async function del(key: any) {
    return (await dbPromise).delete('owner', key);
}

export async function clear() {
    return (await dbPromise).clear('owner');
}

export async function keys() {
    return (await dbPromise).getAllKeys('owner');
}
