"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const sql_template_strings_1 = __importDefault(require("sql-template-strings"));
const minimist_1 = __importDefault(require("minimist"));
const main = (token_1, ...args_1) => __awaiter(void 0, [token_1, ...args_1], void 0, function* (token, verbose = false) {
    // open connection to database
    const db = yield (0, sqlite_1.open)({
        filename: './database.db',
        driver: sqlite3_1.default.cached.Database
    });
    // ensure log table exists
    yield db.exec((0, sql_template_strings_1.default) `
		CREATE TABLE IF NOT EXISTS messages (
			msg_id      INTEGER
		, msg_content TEXT
	  ,	msg_user_id INTEGER
		, msg_chat_id INTEGER 
		, PRIMARY KEY (msg_id, msg_chat_id)
	);`);
    const bot = new grammy_1.Bot(token);
    // await bot.api.setMyCommands([{ command: 'dump', description: 'dump select * to console' }])
    // bot.command('dump', _ => {
    // 	db.all(SQL`SELECT * FROM messages`).then(res => console.log(res))
    // });
    // respond to message events. 
    bot.on('message:text', ctx => {
        // if we're in verbose mode, dump recv. message data to console
        if (verbose) {
            console.log(`
Chat ID:         ${ctx.chatId}
Message ID:      ${ctx.msgId}
Sender ID:       ${ctx.from.id}
Message Context: ${ctx.msg.text}`);
        }
        // write to the DB
        db.run((0, sql_template_strings_1.default) `
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
			`).then(val => console.log(val.changes));
    });
    bot.start();
});
const argv = (0, minimist_1.default)(process.argv.slice(2));
if (typeof argv.token !== 'string') {
    console.error('You must provide a bot token as a string (--token)!');
    process.exit(1);
}
// init bot
main(argv.token, argv.v);
