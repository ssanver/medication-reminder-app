# DB Connection Switching

## Amaç
API'nin aynı kod tabanında hem local DB hem production DB ile çalışmasını net ve tekrar edilebilir hale getmek.

## Çözüm
- `Development` ortamında bağlantı: `api/appsettings.Development.json -> ConnectionStrings:DefaultConnection`
- `Production` ortamında bağlantı: `api/appsettings.Production.json -> ConnectionStrings:DefaultConnection`
- Her iki ortamda da anlık override: `DB_CONNECTION_STRING` ortam değişkeni

## Kullanım
1. Local DB ile çalıştırma:
```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --project api/api.csproj
```
2. Production DB ile çalıştırma:
```bash
ASPNETCORE_ENVIRONMENT=Production \
DB_CONNECTION_STRING="<production-connection-string>" \
dotnet run --project api/api.csproj
```

## Kabul Kriterleri
1. `ASPNETCORE_ENVIRONMENT=Development` ile API local SQL Server'a bağlanabilmelidir.
2. `ASPNETCORE_ENVIRONMENT=Production` ve geçerli `DB_CONNECTION_STRING` ile API production DB'ye bağlanabilmelidir.
3. `DB_CONNECTION_STRING` verilirse ilgili ortam dosyasındaki `DefaultConnection` değeri override edilmelidir.

## Ortam Bilgileri (Private Repo)
### Local DB
- Server: `localhost,1433`
- Database: `medication-reminder-db`
- User Id: `sa`
- Password: `YourStrong!Passw0rd`
- Connection String:
`Server=localhost,1433;Database=medication-reminder-db;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True`

### Production DB
- Server: `SQL6034.site4now.net`
- Database: `db_ac5e54_dbpillreminder`
- User Id: `db_ac5e54_dbpillreminder_admin`
- Password: `Sth280711!`
- Connection String:
`Data Source=SQL6034.site4now.net;Initial Catalog=db_ac5e54_dbpillreminder;User Id=db_ac5e54_dbpillreminder_admin;Password=Sth280711!;Encrypt=True;TrustServerCertificate=True;`
