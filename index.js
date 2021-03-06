const Koa = require('koa');
const crypto = require('crypto');

const app = new Koa();
const connRoute = new RegExp('^/conn$');
const uuidRoute = new RegExp('^/uuid$');

// Error handler
app.use(async (ctx, next) => {
  try {
    console.log(`${ctx.request.method}: ${ctx.request.url}`);
    await next();
  } catch (err) {
    console.error(err);
    ctx.body = { message: err.message };
    ctx.status = err.status || 500;
  }
});

// CORS handler
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  if (ctx.method === 'OPTIONS') {
    ctx.body = '';
  } else {
    await next();
  }
});

// Parameter receiver
app.use(async (ctx, next) => {
  if (connRoute.test(ctx.request.path)) {
    const uuid = ctx.request.query.uuid;
    console.log(`Get ${ctx.request.query.test} from ${uuid}`);
    ctx.body = 'Great!';
  } else {
    await next();
  }
});

// UUID generator
app.use(async (ctx, next) => {
  if (uuidRoute.test(ctx.request.path)) {
    const now = new Date();
    let uuid = ctx.headers['if-none-match'];
    let generateUUID = !uuid;
    const lifetime = 10;
    const sinceHeader = ctx.headers['if-modified-since'];
    let since = sinceHeader ? new Date(Date.parse(sinceHeader)) : now;
    let diff = lifetime - Math.floor((now.getTime() - since.getTime()) / 1000);
    if (diff < 0) {
      generateUUID = true;
      since = now;
      diff = lifetime;
    }
    if (generateUUID) {
      uuid = crypto.randomBytes(64).toString('hex');
    } else {
      ctx.status = 304;
    }
    ctx.set('Last-Modified', since.toGMTString());
    ctx.set('Cache-Control', `max-age=${diff}`);
    ctx.set('ETag', uuid);
    ctx.body = { uuid, other: 'if available' };
  } else {
    await next();
  }
});

// Fallback
app.use(async ctx => {
  ctx.body = 'OK';
});

app.listen(3000)
