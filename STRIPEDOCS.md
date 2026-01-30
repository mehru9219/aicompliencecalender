# Entwicklungsumgebung einrichten

Machen Sie sich mit der Stripe-CLI und unseren serverseitigen SDKs vertraut.

Lesen Sie unsere [No-Code-Dokumentation](https://docs.stripe.com/no-code.md), verwenden Sie eine [vorgefertigte Lösung](https://stripe.com/partners/directory) aus unserem Partnerverzeichnis oder engagieren Sie [von Stripe zertifizierte Expertinnen und Experten](https://stripe.com/partners/directory?t=Consulting).

Die serverseitigen SDKs und die Befehlszeilenschnittstelle (CLI) von Stripe ermöglichen die Interaktion mit den REST-APIs von Stripe. Beginnen Sie mit der Stripe-CLI, um Ihre Entwicklungsumgebung zu optimieren und API-Aufrufe durchzuführen.

Verwenden Sie die SDKs, um das Schreiben von Standardcode zu vermeiden. Um Anfragen aus Ihrer Umgebung zu senden, wählen Sie eine Sprache aus, um einen Quickstart-Leitfaden zu befolgen.

> #### Chrome-Erweiterungen
> 
> Wir empfehlen, Ihre Zahlungsintegration mit Stripe (wie [Elements](https://docs.stripe.com/payments/elements.md) oder [Checkout](https://docs.stripe.com/payments/checkout.md)) auf Ihrer eigenen Website zu erstellen. Richten Sie dann Ihre Chrome-Erweiterung so ein, dass Nutzer/innen an diese Zahlungsseite weitergeleitet werden, wenn sie bereit sind, einen Kauf abzuschließen.
> 
> Diese Methode ist sicherer und einfacher zu pflegen, als zu versuchen, Zahlungen direkt in der Erweiterung abzuwickeln.

# Ruby

> This is a Ruby for when lang is ruby. View the full page at https://docs.stripe.com/get-started/development-environment?lang=ruby.

In diesem QuickStart installieren Sie die [Stripe-CLI](https://docs.stripe.com/stripe-cli.md), ein wichtiges Tool, über das Sie Befehlszeilenzugriff auf Ihre Stripe Integration erhalten. Außerdem installieren Sie das [serverseitige Ruby-SDK](https://github.com/stripe/stripe-ruby) von Stripe, um Zugriff auf Stripe-APIs über in Ruby erstellte Anwendungen zu erhalten.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mit einem Bundler mit RubyGems
- Vorgehensweise zur Installation der aktuellen Version des Ruby-SDK von Stripe18.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Stripe CLI einrichten

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Abhängigkeiten von Drittanbietern verwalten

Wir empfehlen, Abhängigkeiten von Drittanbietern mit dem Befehlszeilentool [RubyGems](http://rubygems.org/) zu verwalten. Damit können Sie neue Bibliotheken hinzufügen und in Ihre Ruby-Projekte aufnehmen. Prüfen Sie, ob RubyGems installiert ist:

### RubyGems installieren

#### RubyGems installieren

```bash
gem --version
```

Wenn Sie `gem: command not found` erhalten, [laden Sie RubyGems](http://rubygems.org/pages/download) über die Downloadseite herunter.

## Serverseitiges Ruby-SDK installieren

Die aktuelle Version des serverseitigen Ruby-SDK von Stripe ist v18.2.0. Sie unterstützt die Ruby-Versionen 2.3+.

Prüfen Sie Ihre Ruby-Version:

```bash
ruby -v
```

### Bibliothek installieren

[Erstellen Sie eine GEM-Datei](https://guides.rubygems.org/make-your-own-gem/) und installieren Sie diese dann mit einem Bundler mit [RubyGems](https://rubygems.org/).

Fügen Sie einem Projekt die aktuelle Version von [Stripe Gem](https://rubygems.org/gems/stripe) hinzu:

```bash
bundle add stripe
```

Installieren Sie die erforderlichen Gems aus Ihren angegebenen Quellen:

```bash
bundle install
```

### Alternative Installationsmöglichkeiten

**Abhängigkeit hinzufügen** – Fügen Sie die aktuelle Version der Bibliothek als Gem-Abhängigkeit hinzu:

```ruby
source 'https://rubygems.org'

gem 'rails'
gem 'stripe'
```

**Globale Installation** – Installieren Sie die Bibliothek global mit [RubyGems](https://rubygems.org/):

```bash
gem install stripe
```

**Manuelle Installation** – Erstellen Sie [die GEM-Datei aus der Quelle](https://github.com/stripe/stripe-ruby) und installieren Sie die Bibliothek dann mit folgendem Befehl:

```bash
gem build stripe.gemspec
```

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das Ruby-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. In diesem Beispiel erstellen wir den Preis mit der in der Antwort zurückgegebenen Produktkennung.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```ruby
require 'rubygems'
require 'stripe'
Stripe.api_key = "sk_test_YOUR_STRIPE_SECRET_KEY"

starter_subscription = Stripe::Product.create(
  name: 'Starter Subscription',
  description: '$12/Month subscription',
)

starter_subscription_price = Stripe::Price.create(
  currency: 'usd',
  unit_amount: 1200,
  recurring: {interval: 'month'},
  product: starter_subscription['id'],
)

puts "Success! Here is your starter subscription product id: #{starter_subscription.id}"
puts "Success! Here is your starter subscription price id: #{starter_subscription_price.id}"
```

Speichern Sie die Datei als `create_price.rb`. Wechseln Sie in der Befehlszeile mit `cd` zu dem Verzeichnis mit der Datei, die Sie gerade gespeichert haben. Führen Sie dann Folgendes aus:

#### create_price.rb

```bash
ruby create_price.rb
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Von Stripe gehostete Seite](https://docs.stripe.com/checkout/quickstart.md)
- [Erweiterte Integration](https://docs.stripe.com/payments/quickstart.md)


# Python

> This is a Python for when lang is python. View the full page at https://docs.stripe.com/get-started/development-environment?lang=python.

In diesem QuickStart installieren Sie die [Stripe-CLI](https://docs.stripe.com/stripe-cli.md), ein wichtiges Tool, über das Sie Befehlszeilenzugriff auf Ihre Stripe Integration erhalten. Außerdem installieren Sie das [serverseitige Python-SDK von Stripe](https://github.com/stripe/stripe-python), um Zugriff auf Stripe-APIs über in Python erstellte Anwendungen zu erhalten.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mithilfe einer virtuellen Umgebung und des pip-Paketmanagers
- Vorgehensweise zur Installation der aktuellen Version des Python-SDK von Stripe14.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Ersteinrichtung

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

## Stripe CLI einrichten

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Abhängigkeiten von Drittanbietern verwalten

Wir empfehlen, Abhängigkeiten von Drittanbietern mit dem [venv](https://docs.python.org/3/tutorial/venv.html)-Modul zu verwalten. Damit können Sie neue Bibliotheken hinzufügen und in Ihre Python&nbsp;3-Projekte aufnehmen.

### Unter Windows (cmd.exe):

#### Unter Windows (cmd.exe)

```bash
python3 -m venv env
.\env\Scripts\activate.bat
```

### Unter GNU/Linux oder MacOS (Bash):

#### Unter GNU/Linux oder MacOS (Bash)

```bash
python3 -m venv env
source env/bin/activate
```

## Serverseitiges Python-SDK installieren

Die aktuelle Version des serverseitigen Phyton-SDK von Stripe ist v14.2.0. Sie unterstützt die Python-Versionen 3.6+.

Prüfen Sie Ihre Python-Version:

```bash
python3 --version
```

### Bibliothek installieren

Installieren Sie die Bibliothek aus [PyPi](http://pypi.python.org/pypi/stripe/), einem Paketmanager für Python:

```bash
pip3 install --upgrade stripe
```

Geben Sie dann die folgende Version in der Datei requirements.txt an:

```txt
stripe>=14.2.0
```

### Alternative Installationsmöglichkeiten

**Manuelle Installation**&nbsp;– Laden Sie [den Quellcode](https://github.com/stripe/stripe-python) für das SDK herunter und installieren Sie die Bibliothek dann mit folgendem Befehl:

```bash
python3 setup.py install
```

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das Python-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. In diesem Beispiel erstellen wir den Preis mit der in der Antwort zurückgegebenen Produktkennung.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```python
import stripe
stripe.api_key = "sk_test_YOUR_STRIPE_SECRET_KEY"

starter_subscription = stripe.Product.create(
  name="Starter Subscription",
  description="$12/Month subscription",
)

starter_subscription_price = stripe.Price.create(
  unit_amount=1200,
  currency="usd",
  recurring={"interval": "month"},
  product=starter_subscription['id'],
)

# Save these identifiers
print(f"Success! Here is your starter subscription product id: {starter_subscription.id}")
print(f"Success! Here is your starter subscription price id: {starter_subscription_price.id}")
```

Speichern Sie die Datei als `create_price.py`. Wechseln Sie in der Befehlszeile mit `cd` zu dem Verzeichnis mit der Datei, die Sie gerade gespeichert haben. Führen Sie dann Folgendes aus:

#### create_price.py

```bash
python3 create_price.py
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Vorgefertigte Bezahlseite](https://docs.stripe.com/checkout/quickstart.md)
- [Personalisierter Zahlungsablauf](https://docs.stripe.com/payments/quickstart.md)


# Go

> This is a Go for when lang is go. View the full page at https://docs.stripe.com/get-started/development-environment?lang=go.

In diesem QuickStart installieren Sie die [Stripe-CLI](https://docs.stripe.com/stripe-cli.md), ein wichtiges Tool, über das Sie Befehlszeilenzugriff auf Ihre Stripe Integration erhalten. Außerdem installieren Sie das [serverseitige Go-SDK von Stripe](https://github.com/stripe/stripe-go), um Zugriff auf Stripe-APIs über in Go erstellte Anwendungen zu erhalten.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mithilfe von Go-Modulen
- Vorgehensweise zur Installation der aktuellen Version des Go-SDK von Stripe84.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Ersteinrichtung

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

## Stripe CLI einrichten

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Abhängigkeiten von Drittanbietern verwalten

Wir empfehlen, Abhängigkeiten von Drittanbietern mit [Go-Modulen](https://go.dev/blog/using-go-modules) zu verwalten. Damit können Sie neue Bibliotheken hinzufügen und in Ihre Go-Projekte aufnehmen.

### Go initialisieren

Wenn Sie in einem neuen Verzeichnis von Grund auf neu beginnen, müssen Sie zunächst die Datei `go.mod` erstellen, um die Abhängigkeiten zu verfolgen. Zum Beispiel:

#### Go initialisieren

```bash
go mod init stripe-example
```

## Serverseitiges Go-SDK installieren

Die aktuelle Version des serverseitigen Go-SDK von Stripe ist v84.2.0. Sie unterstützt die Go-Versionen 1.15+.

### Bibliothek installieren

Installieren Sie die Bibliothek mit [Go-Modulen](https://go.dev/blog/using-go-modules), einem Paketmanager für Go:

```bash
go get github.com/stripe/stripe-go/v84
```

Nachdem Sie die Bibliothek mit Go-Modulen in einem *neuen* Projekt installiert haben, wird die Bibliothek automatisch als Abhängigkeit zur Datei go.mod Ihres Projekts hinzugefügt. Zum Beispiel:

```go.mod
module stripe-example

go 1.18

require github.com/stripe/stripe-go/v84 84.2.0 // indirect
```

### Abhängigkeiten synchronisieren

Um Ihre verwalteten Abhängigkeiten für ein *bestehendes* Projekt in Ordnung zu halten, führen Sie den folgenden Befehl aus, um die [Abhängigkeiten Ihres Codes zu synchronisieren](https://go.dev/doc/modules/managing-dependencies).

```bash
go mod tidy
```

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das Go-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. In diesem Beispiel erstellen wir den Preis mit der in der Antwort zurückgegebenen Produktkennung.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```go
package main

import (
  "fmt"
  "github.com/stripe/stripe-go/v84"
  "github.com/stripe/stripe-go/v84/product"
  "github.com/stripe/stripe-go/v84/price"
)

func main() {
  stripe.Key = "sk_test_YOUR_STRIPE_SECRET_KEY"

	product_params := &stripe.ProductParams{
		Name:        stripe.String("Starter Subscription"),
		Description: stripe.String("$12/Month subscription"),
	}
	starter_product, _ := product.New(product_params)

	price_params := &stripe.PriceParams{
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		Product:  stripe.String(starter_product.ID),
		Recurring: &stripe.PriceRecurringParams{
			Interval: stripe.String(string(stripe.PriceRecurringIntervalMonth)),
		},
		UnitAmount: stripe.Int64(1200),
	}
	starter_price, _ := price.New(price_params)

	fmt.Println("Success! Here is your starter subscription product id: " + starter_product.ID)
	fmt.Println("Success! Here is your starter subscription price id: " + starter_price.ID)
}
```

Speichern Sie die Datei als `create_price.go`. Wechseln Sie in der Befehlszeile mit `cd` zu dem Verzeichnis mit der Datei, die Sie gerade gespeichert haben. Führen Sie dann Folgendes aus:

#### create_price.rb

```bash
go run create_price.go
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Vorgefertigte Bezahlseite](https://docs.stripe.com/checkout/quickstart.md)
- [Personalisierter Zahlungsablauf](https://docs.stripe.com/payments/quickstart.md)


# Java

> This is a Java for when lang is java. View the full page at https://docs.stripe.com/get-started/development-environment?lang=java.

In diesem QuickStart installieren Sie die [Stripe-CLI](https://docs.stripe.com/stripe-cli.md), ein wichtiges Tool, über das Sie Befehlszeilenzugriff auf Ihre Stripe Integration erhalten. Außerdem installieren Sie das [serverseitige Java-SDK von Stripe](https://github.com/stripe/stripe-java), um Zugriff auf Stripe-APIs über in Java erstellte Anwendungen zu erhalten.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mithilfe von Maven oder Gradle
- Vorgehensweise zur Installation der aktuellen Version des Java-SDK von Stripe31.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Ersteinrichtung

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

## Stripe CLI einrichten

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Abhängigkeiten von Drittanbietern verwalten

Wir empfehlen, Abhängigkeiten von Drittanbietern mit [Maven](https://maven.apache.org/guides/getting-started/index.html) oder [Gradle](https://docs.gradle.org) zu verwalten. Damit können Sie ganz einfach neue Bibliotheken hinzufügen und in Ihre Java-Projekte aufnehmen.

### Projekt initialisieren

- Informationen zum Erstellen eines Projekts mit **Maven** finden Sie unter [So erstellen Sie Ihr erstes Maven-Projekt](https://maven.apache.org/guides/getting-started/index.html#How_do_I_make_my_first_Maven_project).
- Informationen zum Erstellen eines Projekts mit **Gradle** finden Sie unter [Java-Beispielanwendung erstellen](https://docs.gradle.org/current/samples/sample_building_java_applications.html).

## Serverseitiges Java-SDK installieren

Die aktuelle Version des serverseitigen Java-SDK von Stripe ist v31.2.0. Sie unterstützt die Java-Versionen 1.8+.

Prüfen Sie Ihre Java-Version:

```bash
java -version
```

### Bibliothek installieren

- Fügen Sie mit **Maven** den folgenden Code in die Datei pom.xml Ihres Projekts ein:

```xml
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>31.2.0</version>
</dependency>
```

- Fügen Sie mit **Gradle** die nächste Zeile in den Block „dependencies“ der Datei build.gradle ein:

```groovy
implementation 'com.stripe:stripe-java:31.2.0'
```

### Alternative Installationsmöglichkeiten

**Manuelle Installation** – Sie können Stripe-Java mit den folgenden JARs manuell installieren: [Laden Sie das Stripe-JAR-Archiv (.jar) herunter](https://search.maven.org/remote_content?g=com.stripe&a=stripe-java&v=LATEST).

[Laden Sie das Gson-JAR-Archiv (.jar)](https://repo1.maven.org/maven2/com/google/code/gson/gson/2.8.9/gson-2.8.9.jar) für [Google Gson](https://github.com/google/gson) herunter.

**ProGuard** – Wenn Sie ProGuard verwenden, müssen Sie die Bibliothek ausschließen, indem Sie Folgendes zur Datei `proguard.cfg` hinzufügen:

```proguard
-keep class com.stripe.** { *; }
```

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das Java-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. In diesem Beispiel erstellen wir den Preis mit der in der Antwort zurückgegebenen Produktkennung.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```java
package com.stripe.sample;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Product;
import com.stripe.param.ProductCreateParams;
import com.stripe.param.PriceCreateParams;
import com.stripe.model.Price;

public class Server {
    public static void main(String[] args) throws StripeException {
        Stripe.apiKey = "sk_test_YOUR_STRIPE_SECRET_KEY";


        ProductCreateParams productParams =
            ProductCreateParams.builder()
                .setName("Starter Subscription")
                .setDescription("$12/Month subscription")
                .build();
        Product product = Product.create(productParams);
        System.out.println("Success! Here is your starter subscription product id: " + product.getId());

        PriceCreateParams params =
            PriceCreateParams
                .builder()
                .setProduct(product.getId())
                .setCurrency("usd")
                .setUnitAmount(1200L)
                .setRecurring(
                    PriceCreateParams.Recurring
                        .builder()
                        .setInterval(PriceCreateParams.Recurring.Interval.MONTH)
                        .build())
                .build();
        Price price = Price.create(params);
        System.out.println("Success! Here is your starter subscription price id: " + price.getId());
    }
}
```

Speichern Sie die Datei als `CreatePrice.java`. Führen Sie das Beispiel aus dem Projekt in Ihrer IDE für Maven oder Gradle aus. Beispiel: `Run 'CreatePrice.main()'`.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Vorgefertigte Bezahlseite](https://docs.stripe.com/checkout/quickstart.md)
- [Personalisierter Zahlungsablauf](https://docs.stripe.com/payments/quickstart.md)


# Node.js

> This is a Node.js for when lang is node. View the full page at https://docs.stripe.com/get-started/development-environment?lang=node.

In diesem QuickStart installieren Sie die [Stripe-CLI](https://docs.stripe.com/stripe-cli.md), ein wichtiges Tool, über das Sie Befehlszeilenzugriff auf Ihre Stripe Integration erhalten. Außerdem installieren Sie das [serverseitige Node-SDK von Stripe](https://github.com/stripe/stripe-node), um Zugriff auf Stripe-APIs über in Node.js erstellte Anwendungen zu erhalten.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mithilfe des npm- oder yarn-Paketmanagers
- Vorgehensweise zur Installation der aktuellen Version des Node-SDK von Stripe20.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Ersteinrichtung

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

## Stripe CLI einrichten

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Serverseitiges Node.js-SDK installieren

Die aktuelle Version des serverseitigen Node.js-SDK von Stripe ist v20.2.0. Sie unterstützt die Node.js-Versionen 12+.

Prüfen Sie Ihre Node-Version:

```bash
node --version
```

### Node initialisieren

#### Node initialisieren

```bash
npm init
```

### Bibliothek installieren

Installieren Sie die Bibliothek mit [npm](https://www.npmjs.com/package/node), einem Paketmanager für Node:

```bash
npm install stripe --save
```

Nachdem Sie die Bibliothek mit npm installiert haben, wird sie automatisch als Abhängigkeit in der Datei package.json des Projekts hinzugefügt. Beispiel:

```json
{
  "name": "stripe-node-example",
  "version": "1.0.0",
  "description": "A Stripe demo",
  "main": "index.js",
  "scripts": {
    "node ": "node create_price.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "stripe": "^20.2.0"
  }
}
```

### Alternative Installationsmöglichkeiten

**Yarn** – Sie können die Bibliothek mit [yarn](https://yarnpkg.com/), einem anderen Paketmanager für Node, installieren:

```bash
yarn add stripe
```

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das Node.js-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. Das Node.js-SDK gibt [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) zurück, die als verkettbare Callbacks verwendet werden können. Zur Demonstration übergeben wir in diesem Beispiel die in der Produktantwort zurückgegebene Produktkennung, um einen Preis zu erstellen.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```node
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY');

stripe.products.create({
  name: 'Starter Subscription',
  description: '$12/Month subscription',
}).then(product => {
  stripe.prices.create({
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    product: product.id,
  }).then(price => {
    console.log('Success! Here is your starter subscription product id: ' + product.id);
    console.log('Success! Here is your starter subscription price id: ' + price.id);
  });
});
```

Speichern Sie die Datei als `create_price.js`. Wechseln Sie in der Befehlszeile mit `cd` zu dem Verzeichnis mit der Datei, die Sie gerade gespeichert haben. Führen Sie dann Folgendes aus:

#### create_price.js

```bash
node create_price.js
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Vorgefertigte Bezahlseite](https://docs.stripe.com/checkout/quickstart.md)
- [Personalisierter Zahlungsablauf](https://docs.stripe.com/payments/quickstart.md)


# PHP

> This is a PHP for when lang is php. View the full page at https://docs.stripe.com/get-started/development-environment?lang=php.

In diesem QuickStart installieren Sie die [Stripe-CLI](https://docs.stripe.com/stripe-cli.md), ein wichtiges Tool, über das Sie Befehlszeilenzugriff auf Ihre Stripe Integration erhalten. Außerdem installieren Sie das [serverseitige PHP-SDK von Stripe](https://github.com/stripe/stripe-php), um Zugriff auf Stripe-APIs über in PHP erstellte Anwendungen zu erhalten.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mithilfe von Composer
- Vorgehensweise zur Installation der aktuellen Version des PHP-SDK von Stripe19.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Ersteinrichtung

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

## Stripe CLI einrichten

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Abhängigkeiten von Drittanbietern verwalten

Wir empfehlen, Abhängigkeiten von Drittanbietern aus [Packagist](https://packagist.org/) mit [Composer](https://getcomposer.org/download/) zu verwalten. Damit können Sie neue Bibliotheken hinzufügen und in Ihre PHP-Projekte aufnehmen.

### Composer installieren

[Laden Sie Composer](https://getcomposer.org/download/) gemäß den Anweisungen über die Befehlszeile herunter.

## Serverseitiges PHP-SDK installieren

Die aktuelle Version des serverseitigen PHP-SDK von Stripe ist v19.2.0. Sie unterstützt die PHP-Versionen 5.6.0+.

Prüfen Sie Ihre PHP-Version:

```bash
php --version
```

### Bibliothek installieren

Installieren Sie die Bibliothek mit [Composer](http://getcomposer.org/), einem Paketmanager für PHP:

```bash
composer require stripe/stripe-php
```

Nachdem Sie die Bibliothek mit Composer installiert haben, wird sie automatisch als Abhängigkeit in der Datei composer.json des Projekts hinzugefügt. Beispiel:

```json
{
    "require": {
        "stripe/stripe-php": "^19.2.0"
    }
}
```

Um Bindings zu nutzen, verwenden Sie die [Autoload](https://getcomposer.org/doc/01-basic-usage.md#autoloading)-Funktion von Composer. Beispiel:

```php
require_once('vendor/autoload.php');
```

### Alternative Installationsmöglichkeiten

**Manuelle Installation**

Sie können [das letzte Release herunterladen](https://github.com/stripe/stripe-php/releases), um die Bindings zu nutzen, und dann die Datei init.php aufnehmen:

```php
require_once('/path/to/stripe-php/init.php');
```

Fügen Sie dann die folgenden Erweiterungen hinzu: [cURL](https://secure.php.net/manual/en/book.curl.php) (oder verwenden Sie optional einen anderen Client als Curl) [json](https://secure.php.net/manual/en/book.json.php) [mbstring](https://secure.php.net/manual/en/book.mbstring.php)

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das PHP-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. In diesem Beispiel erstellen wir den Preis mit der in der Antwort zurückgegebenen Produktkennung.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```php
<?php
require_once('vendor/autoload.php');

$stripe = new \Stripe\StripeClient("sk_test_YOUR_STRIPE_SECRET_KEY");

$product = $stripe->products->create([
  'name' => 'Starter Subscription',
  'description' => '$12/Month subscription',
]);
echo "Success! Here is your starter subscription product id: " . $product->id . "\n";

$price = $stripe->prices->create([
  'unit_amount' => 1200,
  'currency' => 'usd',
  'recurring' => ['interval' => 'month'],
  'product' => $product['id'],
]);
echo "Success! Here is your starter subscription price id: " . $price->id . "\n";

?>
```

Speichern Sie die Datei als `create_price.php`. Wechseln Sie in der Befehlszeile mit `cd` zu dem Verzeichnis mit der Datei, die Sie gerade gespeichert haben. Führen Sie dann Folgendes aus:

#### create_price.php

```bash
php create_price.php

```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: price_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Vorgefertigte Bezahlseite](https://docs.stripe.com/checkout/quickstart.md)
- [Personalisierter Zahlungsablauf](https://docs.stripe.com/payments/quickstart.md)


# .NET

> This is a .NET for when lang is dotnet. View the full page at https://docs.stripe.com/get-started/development-environment?lang=dotnet.

In this quickstart, you install the [Stripe CLI](https://docs.stripe.com/stripe-cli.md)—an essential tool that gets you command line access to your Stripe integration. You also install the [Stripe .NET server-side SDK](https://github.com/stripe/stripe-dotnet) to get access to Stripe APIs from applications written in C#.

## Was Sie erfahren

In diesem Quickstart-Leitfaden erfahren Sie:

- Vorgehensweise zum Aufrufen von Stripe-APIs, ohne Code zu erstellen
- Vorgehensweise zur Verwaltung von Abhängigkeiten von Drittanbietern mit der .NET Core CLI, NuGet CLI oder der Paketmanager-Konsole
- Vorgehensweise zur Installation der aktuellen Version des .NET-SDK von Stripe50.2.0
- Vorgehensweise zum Senden Ihrer ersten SDK-Anfrage

## Ersteinrichtung

[Erstellen Sie zunächst ein Stripe-Konto](https://dashboard.stripe.com/register) oder [melden Sie sich an](https://dashboard.stripe.com/login).

## Stripe CLI einrichten

### Installieren

Geben Sie in der Befehlszeile ein Installationsskript an oder laden Sie eine versionierte Archivdatei für Ihr Betriebssystem herunter und extrahieren Sie diese, um die CLI zu installieren.

#### Homebrew

Führen Sie zur Installation der Stripe-CLI mit [Homebrew](https://brew.sh/) Folgendes aus:

```bash
brew install stripe/stripe-cli/stripe
```

Dieser Befehl schlägt fehl, wenn Sie ihn auf der Linux-Version von Homebrew ausführen, aber Sie können diese Alternative verwenden oder den Anweisungen auf der Registerkarte „Linux“ folgen.

```bash
brew install stripe-cli
```

#### apt

> Der Debian-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

> Am 5.&nbsp;April&nbsp;2024 haben wir den GPG-Schlüssel der Stripe-CLI geändert, um die Stripe-CLI über APT zu installieren. Wenn Sie den öffentlichen Schlüssel vor dem 5.&nbsp;April konfiguriert haben, wird Ihnen folgender Fehler angezeigt:
> 
> ```
W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> Um diesen Fehler zu beheben, aktualisieren Sie den GPG-Schlüssel von Stripe, indem Sie [Schritt 1](https://docs.stripe.com/get-started/development-environment.md#step_one) folgen.

So installieren Sie die Stripe-CLI auf Debian- und Ubuntu-basierten Distributionen:

1. Fügen Sie den GPG-Schlüssel der Stripe-CLI zum Schlüsselbund der apt-Quellen hinzu:

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

1. Fügen Sie das apt-Repository der CLI zur Liste der apt-Quellen hinzu:

```bash
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
```

1. Aktualisieren Sie die Paketliste:

```bash
sudo apt update
```

1. Installieren Sie die CLI:

```bash
sudo apt install stripe
```

#### YUM

> Der RPM-Build für die CLI ist auf JFrog unter https://packages.stripe.dev verfügbar, bei dem es sich nicht um eine Domain handelt, die sich im Besitz von Stripe befindet. Wenn Sie diese URL besuchen, werden Sie zur Jfrog-Artifactory-Liste weitergeleitet.

So installieren Sie die Stripe-CLI auf PM-basierten Distributionen:

1. Fügen Sie das yum-Repository der CLI zur Liste der yum-Quellen hinzu:

```bash
echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
```

1. Installieren Sie die CLI:

```bash
sudo yum install stripe
```

#### Scoop

Führen Sie zur Installation der Stripe-CLI mit [Scoop](https://scoop.sh/) Folgendes aus:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

So installieren Sie die Stripe-CLI auf macOS ohne Homebrew:

1. Laden Sie die neueste tar.gz-Datei Ihres CPU-Architekturtyps für `mac-os` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_[XXX]_mac-os_[ARCH_TYPE].tar.gz`.

Installieren Sie optional die Binärdatei in einem Verzeichnis, in dem Sie sie global ausführen können (zum Beispiel `/usr/local/bin`).

#### Linux

So installieren Sie die Stripe-CLI unter Linux ohne einen Paketmanager:

1. Laden Sie die neueste tar.gz-Datei für `linux` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
1. Verschieben Sie `./stripe` in Ihren Ausführungspfad.

#### Windows

Führen Sie zur Installation der Stripe-CLI unter Windows ohne Scoop Folgendes aus:

1. Laden Sie die neueste Zip-Datei für `windows` von [GitHub](https://github.com/stripe/stripe-cli/releases/latest) herunter.
1. Dekomprimieren Sie die Datei `stripe_X.X.X_windows_x86_64.zip`.
1. Fügen Sie den Pfad zur dekomprimierten `stripe.exe`-Datei zu Ihrer Umgebungsvariable `Path` hinzu. Informationen zum Aktualisieren von Umgebungsvariablen finden Sie in der [Microsoft PowerShell-Dokumentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

> Windows-Antivirenscanner kennzeichnen die Stripe-CLI gelegentlich als unsicher. Dies ist wahrscheinlich ein Fehlalarm. Weitere Informationen finden Sie unter [Problem #692](https://github.com/stripe/stripe-cli/issues/692) im GitHub-Repository.

1. Führen Sie die dekomprimierte `.exe`-Datei aus.

#### Docker

Die Stripe-CLI ist auch als [Docker Image](https://hub.docker.com/r/stripe/stripe-cli) verfügbar. Führen Sie zur Installation der neuesten Version Folgendes aus:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Authentifizieren

Melden Sie sich an und authentifizieren Sie Ihr Stripe Nutzer-[Konto](https://docs.stripe.com/get-started/account/activate.md), um eine Reihe von eingeschränkten Schlüsseln zu generieren. Weitere Informationen finden Sie unter [Stripe-CLI-Schlüssel und -Berechtigungen](https://docs.stripe.com/stripe-cli/keys.md).

```bash
  stripe login
```

Drücken Sie die **Eingabetaste** auf Ihrer Tastatur, um den Authentifizierungsvorgang in Ihrem Browser abzuschließen.

```bash
Your pairing code is: enjoy-enough-outwit-win
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
```

### Einrichtung bestätigen

Nachdem Sie die CLI installiert haben, können Sie eine einzelne API-Anfrage zum [Erstellen eines Produkts](https://docs.stripe.com/api/products/create.md) tätigen.

#### Bash

```bash
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

Suchen Sie nach der Produktkennung (in `id`) im Antwortobjekt. Speichern Sie sie für den nächsten Schritt.

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "prod_LTenIrmp8Q67sa", // Die Kennung sieht wie folgt aus.
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1668198126,
  "default_price": null,
  "description": "Created with the Stripe CLI",
  "identifiers": {},
  "images": [],
  "livemode": false,
  "metadata": {},
  "name": "My First Product",
  "package_dimensions": null,
  "price": null,
  "product_class": null,
  "shippable": null,
  "sku": "my-first-product-10",
  "statement_descriptor": null,
  "tax_code": null,
  "type": "service",
  "unit_label": null,
  "updated": 1668198126,
  "url": null
}
```

Rufen Sie als Nächstes [Preis erstellen](https://docs.stripe.com/api/prices/create.md) auf, um einen Preis in Höhe von 30&nbsp;USD anzufügen. Ersetzen Sie den Platzhalter in `product` durch Ihre Produktkennung (z. B. `prod_LTenIrmp8Q67sa`).

#### Bash

```bash
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product="{{PRODUCT_ID}}"
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt.

#### Bash

```json
{
  "id": "price_1KzlAMJJDeE9fu01WMJJr79o", // Die Kennung sieht wie folgt aus.
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1652636348,
  "currency": "usd",
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "product": "prod_Lh9iTGZhb2mcBy",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 3000,
  "unit_amount_decimal": "3000"
}
```

## Serverseitiges .NET-SDK installieren

Die aktuelle Version des serverseitigen .NET-SDK von Stripe ist v50.2.0. Sie unterstützt .NET Standard 2.0+, .NET Core 2.0+ und .NET Framework 4.6.1+.

Prüfen Sie Ihre [.NET SDK](https://docs.microsoft.com/en-us/dotnet/core/install/how-to-detect-installed-versions)-Version:

```bash
dotnet --list-sdks
```

### Bibliothek installieren

Verwenden Sie die [.NET Core-Befehlszeilenschnittstelle (CLI)](https://docs.microsoft.com/en-us/dotnet/core/tools/), um ein neues Projekt über die Befehlszeile zu erstellen:

```bash
dotnet new console
```

Führen Sie zur Installation der Bibliothek diesen Befehl aus, um die Paketreferenz zur Projektdatei (`.csproj`) hinzuzufügen:

```bash
dotnet add package Stripe.net
```

Nachdem Sie die Bibliothek mit der CLI installiert haben, wird sie automatisch als Abhängigkeit in der Projektdatei (`.csproj`) hinzugefügt. Beispiel:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Stripe.net" Version="50.2.0" />
  </ItemGroup>

</Project>
```

### Alternative Installationsmöglichkeiten

**NuGet-Befehlszeilenschnittstelle (CLI)** – Verwenden Sie die [NuGet CLI](https://docs.microsoft.com/en-us/nuget/tools/nuget-exe-cli-reference), um die Bibliothek zu installieren:

```bash
nuget install Stripe.net
```

**Paket-Manager-Konsole (PowerShell)** – Wenn Sie die [Paket-Manager-Konsole (PowerShell)](https://docs.microsoft.com/en-us/nuget/tools/package-manager-console) verwenden, führen Sie den folgenden Befehl aus, um die Bibliothek zu installieren:

```PowerShell
Install-Package Stripe.net
```

**VisualStudio** – So fügen Sie das Stripe.net-Paket zu Visual Studio hinzu: Öffnen Sie den Projektmappen-Explorer. Klicken Sie mit der rechten Maustaste auf Ihr Projekt. Klicken Sie auf **NuGet-Pakete verwalten**. Klicken Sie auf die Registerkarte **Durchsuchen** und suchen Sie nach **Stripe.net**. Klicken Sie auf das Paket **Stripe.net**, wählen Sie die entsprechende Version auf der Registerkarte aus und klicken Sie auf **Installieren**.

## Ihre erste SDK-Anfrage ausführen

Nachdem Sie das .NET-SDK installiert haben, können Sie mit nur wenigen API-Anfragen ein Abonnement-[Produkt](https://docs.stripe.com/api/products/create.md) erstellen und diesem einen [Preis](https://docs.stripe.com/api/prices/create.md) zuordnen. In diesem Beispiel erstellen wir den Preis mit der in der Antwort zurückgegebenen Produktkennung.

> In diesem Beispiel werden die Standardschlüssel Ihres Stripe-[Nutzerkonto](https://docs.stripe.com/get-started/account/activate.md) für Ihre *Sandbox* (A sandbox is an isolated test environment that allows you to test Stripe functionality in your account without affecting your live integration. Use sandboxes to safely experiment with new features and changes)-Umgebung verwendet. Nur Sie können diese Werte sehen.

#### Produkt und Preis erstellen

```dotnet
using System;
using Stripe;

class Program
{
  static void Main(string[] args)
  {
    StripeConfiguration.ApiKey = "sk_test_YOUR_STRIPE_SECRET_KEY";

    var optionsProduct = new ProductCreateOptions
    {
      Name = "Starter Subscription",
      Description = "$12/Month subscription",
    };
    var serviceProduct = new ProductService();
    Product product = serviceProduct.Create(optionsProduct);
    Console.Write("Success! Here is your starter subscription product id: {0}\n", product.Id);

    var optionsPrice = new PriceCreateOptions
    {
      UnitAmount = 1200,
      Currency = "usd",
      Recurring = new PriceRecurringOptions
      {
          Interval = "month",
      },
      Product = product.Id
    };
    var servicePrice = new PriceService();
    Price price = servicePrice.Create(optionsPrice);
    Console.Write("Success! Here is your starter subscription price id: {0}\n", price.Id);
  }
}
```

Speichern Sie den Code in der Datei `Program.cs` in Ihrem Projekt. Wechseln Sie in der Befehlszeile mit `cd` zu dem Verzeichnis mit der Datei, die Sie gerade gespeichert haben. Führen Sie dann Folgendes aus:

#### Program.cs

```bash
dotnet run
```

Wenn alles funktioniert, wird die folgende Antwort in der Befehlszeile angezeigt. Speichern Sie diese Kennungen, damit Sie sie beim Erstellen der Integration verwenden können.

#### bash

```bash
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

## See also

Damit ist dieser Quickstart-Leitfaden abgeschlossen. Über die unten stehenden Links finden Sie weitere Möglichkeiten dazu, wie Sie Zahlungen für gerade erstellte Produkte verarbeiten.

- [Zahlungslink erstellen](https://docs.stripe.com/payment-links.md)
- [Vorgefertigte Bezahlseite](https://docs.stripe.com/checkout/quickstart.md)
- [Personalisierter Zahlungsablauf](https://docs.stripe.com/payments/quickstart.md)
