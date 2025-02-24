# ROUTES

## `GET:/login`

### Request body
- `username`
- `password`

### Response
    json `{ key: string }`
or
    status 401

## `GET:/logout`

### Request body
- `key`

### Response

    status 200

## auth use route

### Request body
- `key`

### Response

    next
or
    status 401











---

---

---

---









## `GET:/fetch`

### Request body
- `repopath`

### Response

Download (folder) zip


## `GET:/new`

### Request body
- `repopath`

### Response
    Success
or
    Error



## `GET:/delete`

### Request body
- `repopath`

### Response
    Success
or
    Error


## `GET:/branch`

### Request body
- `branch`
- `repopath`

### Response
    json `{ key: string }`
or
    status 401



## `GET:/merge`

### Request body
- `repopath`
- `repopath`

### Response
    Success
or
    Error



## `GET:/push`

### Request body
- `repopath`
- `payload` (folder)

### Response
    json `{ key: string }`
or
    status 401