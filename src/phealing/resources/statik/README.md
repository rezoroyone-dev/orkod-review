# statik (generated)

This directory normally contains a generated `statik.go` produced by
[`statik`](https://github.com/rakyll/statik), which embeds built frontend assets into the Go
binary as an in-memory file system.

`statik.go` is a **large generated artifact** (it embeds a full frontend build) and is therefore
**not included** in this review snapshot.

`resources.go` (in the parent package) imports this package for its side effects and uses the
resulting file system to serve static assets:

```go
import _ "PranicServer/resources/statik"
```

## Regenerating

To build the backend, regenerate the embedded assets:

```bash
go install github.com/rakyll/statik@latest
cd src/phealing
statik -src=./resources/statik-files -dest=./resources
# then `go build ./...`
```

Without `statik.go`, the `PranicServer/resources/statik` package has no Go files and the backend
will not compile until it is regenerated. This does not affect frontend development or the
public 3D/anatomy experience.
