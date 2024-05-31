import { Bot, Composer, Context, Filter, FilterQuery } from 'grammy';
import { env } from 'process';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import SQL from 'sql-template-strings';
import minimist from 'minimist';

const dumpMsg = (message: any) => {
	console.log(`
Chat ID:         ${message.chatId}
Message ID:      ${message.msgId}
Sender ID:       ${message.from.id}
Message Context: ${message.msg.text}`
	);
}

const main = async (token: string, verbose = false, database = './database.db') => {
	// open connection to database
	const db = await open({
		filename: database,
		driver: sqlite3.cached.Database
	});

	// ensure log table exists
	await db.exec(SQL`
		CREATE TABLE IF NOT EXISTS messages (
			msg_id      INTEGER
		, msg_content TEXT
	  ,	msg_user_id INTEGER
		, msg_chat_id INTEGER 
		, PRIMARY KEY (msg_id, msg_chat_id)
	);`);

	const bot = new Bot(token);

	// await bot.api.setMyCommands([{ command: 'dump', description: 'dump select * to console' }])

	// bot.command('dump', _ => {
	// 	db.all(SQL`SELECT * FROM messages`).then(res => console.log(res))
	// });

	// respond to message events. 
	bot.on('message:text',
		ctx => {
			if (verbose) {
				dumpMsg(ctx);
			}

			db.run(SQL`
				INSERT INTO messages
									( msg_id
									, msg_content
									, msg_user_id
									, msg_chat_id 
									)
				VALUES    ( ${ctx.msgId}
									, ${ctx.msg.text}
									, ${ctx.from.id}
									, ${ctx.chatId}
									);
			`);
		}
	);

	bot.on('edit', ctx => {
		if (verbose) {
			dumpMsg(ctx);
		}

		db.run(SQL`
			UPDATE messages
			SET    msg_content = ${ctx.msg.text}
			WHERE  msg_chat_id = ${ctx.chatId} 
			AND    msg_id      = ${ctx.msgId} 
		`)
	});

	bot.start();
}

const argv = minimist(process.argv.slice(2));

if (typeof argv.token !== 'string') {
	console.error('You must provide a bot token as a string (--token)!');
	process.exit(1);
}

// init bot
main(argv.token, argv.v, argv.database ?? './database.db');
