# VK Mini Apps auth fo Hapi

Simple implementation for auth flow in VK Mini Apps

[Docs](https://vk.com/dev/vk_apps_docs3?f=6.1%20Подпись%20параметров%20запуска)
```
npm install --save hapi-vkminiapps-auth
```

### Usage:
```javascript
const Hapi = require('@hapi/hapi');

const start = async () => {
    const server = Hapi.server({ port: 4000 });

    await server.register(require('hapi-vkminiapps-auth'));

    server.auth.strategy('vk', 'vk-mini-app', { clientSecret: '...', validate: async (credentials) => { // Credentials is same as below
      if (credentials.vk_user_id === 98712) {
        return {isValid: true, credentials}
      } else {
        return {isValid: false, error: 'Forbidden'}
      }    
    }});

    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: 'vk'
        },
        handler: function (request) {

            return request.auth.credentials;
        }
    });
    await server.start();

    console.log('server running at: ' + server.info.uri);
};

start();
```

Example `request.auth.credentials`:
```json
{
    "vk_access_token_settings": "friends",
    "vk_app_id": 7130099,
    "vk_are_notifications_enabled": 0,
    "vk_is_app_user": 0,
    "vk_is_favorite": 0,
    "vk_language": "ru",
    "vk_platform": "desktop_web",
    "vk_ref": "other",
    "vk_user_id": 1234
}
```
