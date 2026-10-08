# @unabandoned/amf

> **This is a maintained fork of [astronautlabs/amf][upstream], published as
> [`@unabandoned/amf`][pkg].** Upstream's last release was 0.0.6 in July 2022.
> The API and the published layout (`dist/` CommonJS, `dist.esm/` ES modules)
> are unchanged; the fork exists to keep it and its dependency tree current.
> See [.unabandoned.yml](.unabandoned.yml).
>
> To take it without touching imports, alias it:
> `"@astronautlabs/amf": "npm:@unabandoned/amf@<version>"`.

[upstream]: https://github.com/astronautlabs/amf
[pkg]: https://www.npmjs.com/package/@unabandoned/amf

> **[📜 Adobe AMF version 0](https://rtmp.veriskope.com/pdf/amf0-file-format-specification.pdf)**  
> Adobe's Action Message Format v0

> **[📜 Adobe AMF version 3](https://rtmp.veriskope.com/pdf/amf3-file-format-spec.pdf)**  
> Adobe’s Action Message Format v3

> 📺 Part of the [**Astronaut Labs Broadcast Suite**](https://github.com/astronautlabs/broadcast)
>
> See also:
> - [@/rtmp](https://github.com/astronautlabs/rtmp) - Adobe's Real Time Messaging Protocol (RTMP)
> - [@/flv](https://github.com/astronautlabs/flv) - Adobe's Flash Video format (FLV)

> 📝 **Alpha Quality**  
> This library is new, no compatibility is currently guaranteed between 
> releases (beta, semver 0.0.x).

---

# Installation

```
npm i @unabandoned/amf reflect-metadata
```

The underlying bitstream library ([`@unabandoned/bitstream`](https://github.com/unabandoned/bitstream),
the maintained fork of `@astronautlabs/bitstream`, installed under its original name) reads
type metadata through `Reflect.getMetadata`, so load `reflect-metadata` (0.1.13+ or 0.2.x, or
another polyfill of that API) once before using this package.

# Usage

```typescript
import 'reflect-metadata'; // required once, before first use (see below)
import { AMF0, AMF3 } from '@unabandoned/amf';

// Encode AMF values

let encoded : Uint8Array;
encoded = AMF0.Value.any(123).serialize();
encoded = AMF0.Value.any(false).serialize();
encoded = AMF0.Value.any(null).serialize();
encoded = AMF0.Value.any({ hello: 'world' }).serialize();
encoded = AMF0.Value.any([ 1, 2, "types", "are", "good" ]).serialize();

// Be specific about types

encoded = AMF3.Value.vector(Int32Array.from([0,1,2,3]));

// Transparent passthrough of existing AMF values

encoded = AMF3.Value.object({ 
    foo: 123,
    bar: AMF3.Value.dictionary({
        baz: 321,
        fizz: 'hello'
    })
})

// Decode values (from Uint8Array/Buffer)

let decoded : AMF0.Value = AMF0.Value.deserialize(encoded);
```
