# XlerAI Node API Library

[![NPM version](https://img.shields.io/npm/v/xlerai.svg)](https://npmjs.org/package/xlerai)

This library provides convenient access to the XlerAI REST API from TypeScript or JavaScript.

 The library wraps the [openai node library](https://github.com/openai/openai-node),
points it at `api.xler.ai/v1` for you, and extends their library further with additional functionality.

## Documentation

Documentation can be found [on docs.xler.ai](https://docs.xler.ai/sdks/node).

## Installation

```sh
npm install --save xlerai
# or
yarn add xlerai
```

## Usage

<!-- prettier-ignore -->
```js
import XlerAI from 'xlerai';

const xlerai = new XlerAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const chatCompletion = await xlerai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
  });
}

main();
```

## Streaming Responses

We provide support for streaming responses using Server Sent Events (SSE).

```ts
import XlerAI from 'xlerai';

const xlerai = new XlerAI();

async function main() {
  const stream = await xlerai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Say this is a test' }],
    stream: true,
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();
```

If you need to cancel a stream, you can `break` from the loop
or call `stream.controller.abort()`.

### Request & Response types

This library includes TypeScript definitions for all request params and response fields. You may import and use them like so:

<!-- prettier-ignore -->
```ts
import XlerAI from 'xlerai';

const xlerai = new XlerAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const params: XlerAI.Chat.ChatCompletionCreateParams = {
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
  };
  const chatCompletion: XlerAI.Chat.ChatCompletion = await xlerai.chat.completions.create(params);
}

main();
```

### Streaming responses

This library provides several conveniences for streaming chat completions, for example:

```ts
import XlerAI from 'xlerai';

const xlerai = new XlerAI();

async function main() {
  const stream = await xlerai.beta.chat.completions.stream({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Say this is a test' }],
    stream: true,
  });

  stream.on('content', (delta, snapshot) => {
    process.stdout.write(delta);
  });

  // or, equivalently:
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }

  const chatCompletion = await stream.finalChatCompletion();
  console.log(chatCompletion); // {id: "…", choices: […], …}
}

main();
```

Alternatively, you can use `xlerai.chat.completions.create({ stream: true, … })`
which only returns an async iterable of the chunks in the stream and thus uses less memory
(it does not build up a final chat completion object for you).

If you need to cancel a stream, you can `break` from a `for await` loop or call `stream.abort()`.

### Automated function calls

We provide the `xlerai.beta.chat.completions.runTools({…})`
convenience helper for using function tool calls with the `/chat/completions` endpoint
which automatically call the JavaScript functions you provide
and sends their results back to the `/chat/completions` endpoint,
looping as long as the model requests tool calls.

If you pass a `parse` function, it will automatically parse the `arguments` for you
and returns any parsing errors to the model to attempt auto-recovery.
Otherwise, the args will be passed to the function you provide as a string.

If you pass `tool_choice: {function: {name: …}}` instead of `auto`,
it returns immediately after calling that function (and only loops to auto-recover parsing errors).

```ts
import XlerAI from 'xlerai';

const client = new XlerAI();

async function main() {
  const runner = client.beta.chat.completions
    .runTools({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'How is the weather this week?' }],
      tools: [
        {
          type: 'function',
          function: {
            function: getCurrentLocation,
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function',
          function: {
            function: getWeather,
            parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
              },
            },
          },
        },
      ],
    })
    .on('message', (message) => console.log(message));

  const finalContent = await runner.finalContent();
  console.log();
  console.log('Final content:', finalContent);
}

async function getCurrentLocation() {
  return 'Boston'; // Simulate lookup
}

async function getWeather(args: { location: string }) {
  const { location } = args;
  // … do lookup …
  return { temperature, precipitation };
}

main();

// {role: "user",      content: "How's the weather this week?"}
// {role: "assistant", tool_calls: [{type: "function", function: {name: "getCurrentLocation", arguments: "{}"}, id: "123"}
// {role: "tool",      name: "getCurrentLocation", content: "Boston", tool_call_id: "123"}
// {role: "assistant", tool_calls: [{type: "function", function: {name: "getWeather", arguments: '{"location": "Boston"}'}, id: "1234"}]}
// {role: "tool",      name: "getWeather", content: '{"temperature": "50degF", "preciptation": "high"}', tool_call_id: "1234"}
// {role: "assistant", content: "It's looking cold and rainy - you might want to wear a jacket!"}
//
// Final content: "It's looking cold and rainy - you might want to wear a jacket!"
```

## Requirements

TypeScript >= 4.5 is supported.

The following runtimes are supported:

- Node.js 18 LTS or later ([non-EOL](https://endoflife.date/nodejs)) versions.
- Bun 1.0 or later.
- Cloudflare Workers.
- Vercel Edge Runtime.
- Jest 28 or greater with the `"node"` environment (`"jsdom"` is not supported at this time).
- Nitro v2.6 or greater.

Note that React Native is not supported at this time.

If you are interested in other runtime environments, please open or upvote an issue on GitHub.
