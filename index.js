const Koa = require('koa');
const crypto = require('crypto');

const app = new Koa();
const connRoute = new RegExp('^/conn/[0-9a-f]+$');
const etagRoute = new RegExp('^/etag$');

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
  await next();
});

// 
app.use(async (ctx, next) => {
  if (connRoute.test(ctx.request.path)) {
    const uuid = ctx.request.path.split('/')[2];
    console.log(`Get params ${ctx.request.querystring} of ${uuid}`);
    ctx.body = 'Great!';
  } else {
    await next();
  }
});

app.use(async (ctx, next) => {
  if (etagRoute.test(ctx.request.path)) {
    let uuid = ctx.headers['if-none-match'];
    if (!uuid) {
      uuid = crypto.randomBytes(64).toString('hex');
    }
    ctx.set('ETag', uuid);
    ctx.body = { uuid, other: 'if available' };
  } else {
    await next();
  }
});

app.use(async ctx => {
  ctx.body = 'OK';
});

app.listen(3000)
