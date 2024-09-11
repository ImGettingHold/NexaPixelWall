# electrum-cash

Electrum-cash is a lightweight `JavaScript` library that lets you connect with one or more `Electrum` servers.
It offers encrypted connections by default,
performs the expected protocol version negotiation and
automatically keeps your connection alive until your close it.

## Installation

Install the library with NPM:

```bash
# npm install electrum-cash
```

## Usage

### Load library

Before you can use the library you need to include it in your project.

If you only want to use a **single server**, load the `ElectrumClient` module:

```js
// Load the electrum library.
const { ElectrumClient } = require('electrum-cash');
```

If you want to use **multiple servers**, load the `ElectrumCluster` module:

```js
// Load the electrum library.
const { ElectrumCluster } = require('electrum-cash');
```

### Connect to servers

After you have loaded the appropriate module you need to initialize the module by configuring your **application identifier** and **protocol version**.

If you only want to use a single server, initialize an `ElectrumClient` and connect to the server:
```js
// Initialize an electrum client.
const electrum = new ElectrumClient('Electrum client example', '1.4.1', 'bch.imaginary.cash');

// Wait for the client to connect
await electrum.connect();
```

If you want to use multiple servers, initialize an `ElectrumCluster` and add some servers:

*For more information on various cluster configurations, read the [cluster documentation](https://read.cash/@JonathanSilverblood/electrum-cash-strategic-use-of-clusters-83743111).*

```js
// Initialize an electrum cluster where 2 out of 3 needs to be consistent, polled randomly with fail-over (default).
const electrum = new ElectrumCluster('Electrum cluster example', '1.4.1', 2, 3);

// Add some servers to the cluster.
electrum.addServer('bch.imaginary.cash');
electrum.addServer('electroncash.de');
electrum.addServer('electroncash.dk');
electrum.addServer('electron.jochen-hoenicke.de', 51002);
electrum.addServer('electrum.imaginary.cash');

// Wait for enough connections to be available.
await electrum.ready();
```

### Request information

Once your `ElectrumClient` or `ElectrumCluster` is connected and ready, you can call methods:

*For a list of methods you can use, refer to the [Electrum Cash documentation](https://bitcoincash.network/electrum/).*

```js
// Declare an example transaction ID.
const transactionID = '4db095f34d632a4daf942142c291f1f2abb5ba2e1ccac919d85bdc2f671fb251';

// Request the full transaction hex for the transaction ID.
const transactionHex = await electrum.request('blockchain.transaction.get', transactionID);

// Print out the transaction hex.
console.log(transactionHex);
```

### Subscribe to notifications.

Once your `ElectrumClient` or `ElectrumCluster` is connected and ready, you can set up subscriptions to get notifications on events:

*For a list of methods you can subscribe to, refer to the [Electrum Cash documentation](https://bitcoincash.network/electrum/).*

```js
// Set up a callback function to handle new blocks.
const handleNotifications = function(data)
{
	if(data.method === 'blockchain.headers.subscribe')
	{
		// Print out the block information.
		// {
		// 	jsonrpc: '2.0',
		// 	method: 'blockchain.headers.subscribe',
		// 	params:
		// 	[
		// 		{
		// 		height: 797111,
		// 		hex: '002001202a6b1367f68201ad957e95bec9bda3f132ca2fcb75c0c000000000000000000074befba60bd8615d87ddb636aa99bc032cec8db3adb0d915d45391bc811c1e9ceacf89647a60051819a79559'
		// 		}
		// 	]
		// }
		console.log(data);
	}
}

// Listen for notifications.
electrum.on('notification', handleNotifications);

// Set up a subscription for new block headers.
await electrum.subscribe('blockchain.headers.subscribe');
```

### Shutting down

When you're done and don't want to be connected anymore you can disconnect the server(s).

If you're using a single `ElectrumClient`, call the `disconnect()` function:

```js
// Close the connection.
await electrum.disconnect();
```

If you're using a `ElectrumCluster` with multiple servers, call the `shutdown()` function.

```js
// Close all connections.
await electrum.shutdown();
```

## Documentation

For a complete list of methods and parameters, read the [API documentation](https://generalprotocols.gitlab.io/electrum-cash/library/).

## Support and communication

If you need help with how to use the library or just want to talk about electrum-cash, you can find us on [Telegram](https://t.me/electrumcash) and [Discord](https://discord.gg/ZjXQzew).

You can also read our tutorials on [read.cash](https://read.cash/c/electrum-cash-f45e), or share your own.

## Notes

The keep-alive functionality of this library only works when the protocol version is 1.2 or higher.
