import dns from 'dns';

console.log('Testing dns.resolveSrv with forced 8.8.8.8...');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.getServers().forEach((server) => {
    console.log('Configured DNS Server:', server);
});

dns.resolveSrv('_mongodb._tcp.cluster0.1uoujkk.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('dns.resolveSrv failed:', err.message, err.code);
    } else {
        console.log('dns.resolveSrv succeeded:', addresses);
    }
});
