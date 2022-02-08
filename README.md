# modelify

Modelify is a simple and ready to use application to alter your database.
The application requires an existing database to run.

### Installation

```npm i mysql-modelify```


### Usage

```js
import modelify from 'mysql-modelify';
import express from 'express';

modelify.run(YOUR_PORT_NUMBER, {
    host: 'localhost',
    database: 'modelify',
    user: 'root',
    password: '',
    logQueries: true,
}, express());
```
