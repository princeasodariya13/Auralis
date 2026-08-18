import dns from 'dns';

console.log('Testing dns.resolveSrv...');

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
