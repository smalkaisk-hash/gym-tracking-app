# FitPulse Privātuma politika

**Versija 1.1 · Spēkā no 2026. gada 4. septembra · Pēdējoreiz pārskatīts 2026. gada 21. oktobrī**

<!-- internal:start -->
> **Latvian convenience translation of PRIVACY.md.** English is the authoritative
> version — see `legal/lv/README.md`. The static-host placeholders were resolved and the
> draft marker removed in the 2026-10-21 release, in step with `legal/PRIVACY.md`. Keep the
> two in sync: re-translate here in the same release as any English edit. The build markers
> (draft comment and FILL spots) are deliberately left untranslated. This page still ships
> "pending professional review" via the warn-bordered banner the build adds.
<!-- internal:end -->

---

## Īsā versija

FitPulse ir personīga treniņu uzskaites lietotne. Šeit ir viss būtiskais vienā vietā:

- **Ko mēs glabājam:** jūsu e-pasta adresi, izvēlēto vārdu, neobligāto dzimumu, jūsu
  mērvienību un attēlojuma preferences, kā arī treniņus un ķermeņa svaru, ko pierakstāt.
- **Kāpēc:** lai darbinātu lietotni jūsu vajadzībām. Tas ir viss iemesls. Otra mērķa nav.
- **Jūsu treniņu un ķermeņa svara dati ir veselības dati.** Mēs pret tiem izturamies
  attiecīgi un apstrādājam tos tikai tāpēc, ka jūs devāt nepārprotamu piekrišanu, kad
  izveidojāt kontu.
- **Mēs tos nepārdodam, nekoplietojam, neizmantojam reklāmai un neanalizējam.** Šajā
  lietotnē nav reklāmas tīklu, nav analītikas, nav izsekotāju un nav profilēšanas.
- **Jūsu ierakstus lietotnē varat lasīt tikai jūs.** Katra datubāzes tabula ir piesaistīta
  jūsu konta ID ar datubāzes līmeņa noteikumu, nevis ar lietojumprogrammas kodu. Divus
  izņēmumus mēs labprātāk nosaucam, nekā noklusējam: operators var piekļūt datubāzei tieši
  caur pakalpojumu sniedzēja administratīvo konsoli, un mūsu datubāzes pakalpojumu sniedzēja
  personāls var piekļūt infrastruktūrai saskaņā ar saviem līgumiskajiem kontroles
  mehānismiem. 8. sadaļa skaidro, ko tas nozīmē praksē.
- **Jūs varat neatgriezeniski dzēst visu pats,** sadaļā Iestatījumi → Dzēst kontu. Pilnu
  kopiju varat eksportēt sadaļā Iestatījumi → Dati → Eksportēt dublējumu.
- **Kurš vēl tiem pieskaras:** neliels, nosaukts infrastruktūras uzņēmumu saraksts 6.
  sadaļā. Neviens cits. Nekad.
- **Jūsu dzīvesvieta maina jūsu tiesības, nevis mūsu praksi.** Mēs darām vienu un to pašu ar
  ikviena datiem neatkarīgi no atrašanās vietas — viena datubāze, viens pakalpojumu
  sniedzēju kopums, nekādas reklāmas, nekādas pārdošanas — bet likums dažādiem cilvēkiem dod
  atšķirīgas tiesības pār tiem. 9. sadaļā ir apakšsadaļa **EEZ un Apvienotajai Karalistei**,
  **Kalifornijai**, **Vašingtonas štatam** un pārējām **ASV** daļām. Vašingtonas
  iedzīvotājiem ir arī atsevišķs [Patērētāju veselības datu privātuma
  paziņojums](/consumer-health-data-privacy.html), ko šis štats pieprasa noformēt kā atsevišķu
  dokumentu.
- **Jautājumi vai pieprasījumi:** **smalkaisk@gmail.com**.

Pārējā šī dokumenta daļa ir detaļas aiz šiem apgalvojumiem.

---

## 1. Kas atbild par jūsu datiem

Datu pārzinis — persona, kas nosaka, kāpēc un kā jūsu dati tiek apstrādāti — ir:

- **Kārlis Smalkais**
- Klusā iela 2a, Rīga, LV-1007, Latvija
- **smalkaisk@gmail.com**

<!-- internal:start -->
> **Drafting note.** GDPR Art. 13(1)(a) requires "the identity and the contact details of
> the controller". Google Play separately requires "developer information and a privacy
> point of contact". An email address alone has been found insufficient by EU regulators.
<!-- internal:end -->

Mēs neesam iecēluši datu aizsardzības speciālistu, un mums tas nav jādara: mēs esam viena
privātpersona, mēs neesam publiska iestāde, un mūsu pamatdarbība nav īpašu kategoriju datu
liela mēroga apstrāde (VDAR 37. pants). Iepriekš nosauktais pārzinis atbild uz privātuma
jautājumiem tieši.

Pārzinis ir reģistrēts Latvijā, Eiropas Savienībā, tāpēc lietotājiem EEZ nav nepieciešams
VDAR 27. panta pārstāvis.

Mēs uzturam rakstisku pārskatu par savām apstrādes darbībām, kā VDAR 30. pants to pieprasa
ikvienam, kas apstrādā veselības datus, un pēc pieprasījuma to uzrādīsim uzraudzības
iestādei.

<!-- internal:start -->
> **UK Art. 27 — decided 5 August 2026: no UK representative, exposure accepted knowingly.**
> Being established in the EU settles Art. 27 for the EEA but **not for the UK**, and the
> Art. 27(2) "occasional processing" exemption is unavailable here because this is special
> category data. The reasoning, the consequences and the revisit triggers are recorded in
> `compliance/DECISIONS-AND-ASSESSMENTS.md` § 3 — **do not restate them in this published
> document.** A policy is not the place to announce a known non-conformity, and § 9 already
> tells a UK reader they may complain to their own authority (the ICO), which is the part
> that affects them. Revisit if UK users become a material share of the base.
<!-- internal:end -->

## 2. Ko mēs vācam

### 2.1 Dati, ko jūs mums sniedzat

| Dati | Kad | Obligāti? |
| --- | --- | --- |
| E-pasta adrese | Reģistrējoties | Obligāti — tā ir jūsu pieteikšanās un vienīgais veids, kā atiestatīt paroli |
| Parole | Reģistrējoties | Obligāti. Glabāta tikai kā sālīts jaucējkods; mēs pašu paroli nekad neredzam un neglabājam |
| Redzamais vārds | Sākotnējā iestatīšanā | Obligāti — tā lietotne jūs uzrunā. Segvārds ir pieņemams |
| Dzimums | Sākotnējā iestatīšanā | **Neobligāti.** Atstājiet tukšu, un nekas nesabojāsies |
| Mērvienības (kg/lb), tēma, treniņu sadalījums, pielāgoti dienu nosaukumi, paslēptie vingrojumi, diagrammu preferences | Sākotnējā iestatīšanā un Iestatījumos | Neobligāti |
| Nedēļas treniņu mērķis | Iestatījumos | Neobligāti |
| Treniņi — treniņa tips, datums, ilgums, brīva teksta piezīmes un katram vingrojumam piegājieni, atkārtojumi un svari | Katru reizi, kad pierakstāt sesiju | Neobligāti, taču tas ir lietotnes mērķis |
| Ķermeņa svara ieraksti ar datumiem | Kad pierakstāt svēršanos | Neobligāti |

### 2.2 Automātiski ģenerēti dati

| Dati | Avots | Piezīme |
| --- | --- | --- |
| Jūsu konta ID (nejaušs UUID) un konta izveides/pierakstīšanās laika zīmogi | Mūsu autentifikācijas pakalpojumu sniedzējs | Nepieciešams, lai jūsu ierakstus nošķirtu no ikviena cita ierakstiem |
| **Pierakstīšanās drošības žurnāls** — katra pierakstīšanās, reģistrēšanās un paroles atiestatīšana, norādot laiku, **IP adresi** un izmantoto e-pasta adresi | Mūsu autentifikācijas pakalpojumu sniedzējs, kas tos reģistrē pats | Drošības un ļaunprātīgas izmantošanas atklāšanas ieraksts, ko glabā pakalpojumu sniedzējs, kas veic pierakstīšanos. Tas tiek glabāts atsevišķi no jūsu konta, tāpēc **konta dzēšana to nedzēš** — skatiet 7. sadaļu par to, cik ilgi tas tiek glabāts, un [Noteikumu](/lv/terms.html) 12.7. punktu, kur tas ir minēts starp lietām, kas paliek pēc dzēšanas |
| Sesijas pilnvaras (tokeni) | Jūsu pārlūkprogramma | Uztur jūs pierakstītu |
| Servera pieprasījumu žurnāli, tostarp **IP adrese**, laika zīmogs un veiktais pieprasījums | Mūsu mitināšanas un datubāzes pakalpojumu sniedzēji | Standarta infrastruktūras žurnalēšana — skatiet 7. sadaļu par to, cik ilgi |
| Avāriju un kļūdu ziņojumi | **Nav — lietotne nesūta nevienu.** Skatiet 2.3. | Norādīts šeit, lai to neesamība būtu skaidra, nevis izlaista |

### 2.3 Kļūdu ziņojumi

**Lietotne nekur nesūta avāriju vai kļūdu ziņojumus.** Kļūdu ziņošana ir atspējota mūsu
piegādātajā būvējumā: ziņošanas kods tiek iekļauts tikai tad, ja būvēšanas laikā ir
iestatīta ziņošanas atslēga, un mēs to neiestatām. Kļūdas tiek ierakstītas jūsu pašu
pārlūkprogrammas konsolē un tālāk netiek sūtītas.

Ja mēs to kādreiz ieslēgsim, tas pievienos jaunu jūsu datu saņēmēju — mēs to nosauktu šeit
un 6. sadaļā un pastāstītu jums, pirms tas sākas, kā to pieprasa 12. sadaļa.

### 2.4 Ko mēs apzināti nevācam

Mēs uzskatām, ka šis saraksts ir tikpat svarīgs kā iepriekšējais. FitPulse **nedara** šo:

- nepieprasa un nevāc atrašanās vietas, GPS, kameras, mikrofona, kontaktu, kalendāra, fotoattēlu
  vai veselības platformu (Apple Health / Google Fit / HealthKit) datus;
- nesatur nevienu reklāmas SDK, reklāmas identifikatoru vai jebkādu reklāmas kodu;
- nesatur nevienu analītikas, produkta telemetrijas, sesiju ierakstīšanas, siltumkaršu vai
  A/B testēšanas rīku;
- neizmanto sīkfailus vai ierīces atmiņu izsekošanai (skatiet 5. sadaļu);
- neveido jūsu profilu, neko par jums nesecina un nepieņem nevienu automatizētu lēmumu, kas
  rada juridiskas vai līdzīgi būtiskas sekas (VDAR 22. pants);
- nevāc datus par jums no neviena cita avota kā tikai no jums.

## 3. Veselības dati — svarīgākā daļa

**Jūsu ķermeņa svars, dzimums un treniņu vēsture ir ar veselību saistīti personas dati.**
Saskaņā ar VDAR tie ir "īpašu kategoriju" dati (9. pants); saskaņā ar Vašingtonas My Health
My Data Act tie ir "patērētāja veselības dati"; saskaņā ar ASV FTC Veselības datu pārkāpumu
paziņošanas noteikumu tie ir "PHR identificējama veselības informācija".

Mēs tos apstrādājam, pamatojoties uz jūsu **nepārprotamu piekrišanu** (VDAR 9. panta 2.
punkta a) apakšpunkts), ko sniedz ar atsevišķu, neatzīmētu izvēles rūtiņu, kas parādās
reģistrējoties. Šī piekrišana:

- tiek prasīta atsevišķi no Noteikumu pieņemšanas — tā nekad netiek apvienota;
- attiecas tikai uz 4. sadaļā minēto mērķi un neko citu;
- var tikt **atsaukta jebkurā laikā**, dzēšot kontu vai dzēšot visus datus Iestatījumos, ja
  vēlaties saglabāt pieteikšanos;
- pēc atsaukšanas nepadara apstrādi pirms atsaukšanas par nelikumīgu.

**Mēs saglabājam šīs piekrišanas ierakstu** — datumu un to, kuru šīs politikas un Noteikumu
versiju jūs pieņēmāt. Mums tas ir jādara: likums uzliek pienākumu pierādīt, ka jūs piekritāt,
mums, nevis jums. Ierakstā nav veselības datu, jūs to varat redzēt Iestatījumos un savā
eksportā, tas tiek glabāts tabulā, kuru jūs nevarat mainīt vai dzēst — tāpēc to nevar
pārrakstīt pēc fakta — un tas tiek dzēsts kopā ar jūsu kontu.

**Godīgi par to, ko šeit nozīmē atsaukšana.** Šie dati nav lietotnes blakusparādība; tie
*ir* lietotne. Nav tādas FitPulse versijas, kas turpinātu rādīt jūsu treniņu vēsturi, to
vairs neglabājot. Tāpēc piekrišanas atsaukšana un datu dzēšana ir viena un tā pati darbība,
un mēs neesam izdomājuši starpiestatījumu, kas izliktos citādi. Abi ceļi ir viens
pieskāriens Iestatījumos, neviens neprasa iemeslu, un neviens jums neko nemaksā — tas ir
standarts, ko VDAR nosaka attiecībā uz to, ka atsaukšanai jābūt tikpat vienkāršai kā
piekrišanai (7. panta 3. punkts). Ja vēlaties, lai mēs to izdzēstu jūsu vietā, rakstiet
mums, un mēs to izdarīsim.

<!-- internal:start -->
> **Drafting note — this paragraph is now true; keep it that way.** The sign-up screen has
> a second, separate, never-pre-ticked checkbox for health data, distinct from the one that
> accepts the Terms, and `tests/qa/fuzz.test.mjs` fails if the two are ever merged, either
> pre-ticked, or bypassable in the submit handler. MHMDA defines consent as a "clear
> affirmative act… freely given, specific, informed, opt-in, voluntary and unambiguous" and
> explicitly says it **cannot** be obtained through general terms of use or deceptive
> design. A pre-ticked box, or consent folded into "I agree to the Terms", fails both
> regimes — which is why the guard exists rather than a comment asking nicely.
>
> The open question this paragraph does *not* answer is Art. 7(4): consent is a hard
> precondition of having an account, and Art. 9 has no contract-necessity exception, so a
> regulator could argue it is not freely given. There is no fallback basis if that lands.
> See LEGAL-LIABILITY-AUDIT.md — it is the one item that wants a lawyer, not an edit.
<!-- internal:end -->

Vašingtonas iedzīvotājiem: skatiet atsevišķo [Patērētāju veselības datu privātuma
politiku](/consumer-health-data-privacy.html), ko My Health My Data Act pieprasa mums
publicēt un skaidri norādīt kā saiti.

## 4. Kāpēc mēs tos apstrādājam un uz kāda juridiskā pamata

Katram mērķim ir savs pamats. Nav neviena universāla pamata.

| Mērķis | Izmantotie dati | Juridiskais pamats (VDAR) |
| --- | --- | --- |
| Izveidot un autentificēt jūsu kontu | E-pasts, paroles jaucējkods, konta ID, sesijas pilnvaras | 6. panta 1. punkta b) apakšpunkts — līguma izpilde, kuru noslēdzāt, reģistrējoties |
| Nosūtīt jums paroles atiestatīšanas un konta apstiprināšanas e-pastu | E-pasta adrese | 6. panta 1. punkta b) apakšpunkts |
| Glabāt, attēlot un sinhronizēt treniņus un svēršanās, ko pierakstāt; rādīt jūsu vēsturi, diagrammas un statistiku | Treniņi, ķermeņa svars, preferences, vārds, dzimums | 6. panta 1. punkta b) apakšpunkts **un**, tā kā tie ir veselības dati, 9. panta 2. punkta a) apakšpunkts — nepārprotama piekrišana |
| Rādīt jūsu vārdu lietotnes sveicienā | Vārds | 6. panta 1. punkta b) apakšpunkts |
| Uzturēt pakalpojumu drošu un atklāt un novērst kļūmes | Servera žurnāli; kļūdu ziņojumi, kur tie ir iespējoti | 6. panta 1. punkta f) apakšpunkts — mūsu leģitīmā interese nodrošināt strādājošu, drošu pakalpojumu. Mēs to izsvērām pret jūsu tiesībām: dati ir tehniski, glabāti īsu laiku, nekad netiek izmantoti profila veidošanai un nekad netiek apvienoti ar jūsu treniņu datiem |
| Izpildīt juridisku pienākumu (piem., atbildēt uz likumīgu pieprasījumu vai paziņot par pārkāpumu) | Tik daudz, cik prasa pienākums | 6. panta 1. punkta c) apakšpunkts |

**Mēs neapstrādājam jūsu datus nevienam citam mērķim.** Ja tas kādreiz mainīsies, mēs jums
pastāstīsim par jauno mērķi **pirms** tā sākuma (VDAR 13. panta 3. punkts), un, ja jaunais
mērķis skar jūsu veselības datus, mēs vispirms lūgsim jaunu piekrišanu, kā to pieprasa
MHMDA.

**Vai šo datu sniegšana ir obligāta?** Jūsu e-pasts, parole un redzamais vārds ir
nepieciešami, lai jums būtu konts — bez tiem mēs nevaram sniegt pakalpojumu. Viss pārējais
ir neobligāts; ja jūs to nesniedzat, attiecīgā funkcija vienkārši neko nerāda.

## 5. Glabāšana jūsu pašu ierīcē

FitPulse glabā jūsu datu kopiju jūsu pārlūkprogrammas `localStorage`, lai lietotne darbotos
bezsaistē un atvērtos uzreiz. Tas ir viss — mēs neizmantojam nekādu citu pārlūkprogrammas
atmiņu: nedz IndexedDB, nedz Cache API, nedz service worker, nedz `sessionStorage`. Atslēgas ir:

| Atslēga | Kur | Saturs |
| --- | --- | --- |
| `gym-workouts` | `localStorage` | Jūsu treniņu vēsture |
| `gym-bw-log` | `localStorage` | Jūsu ķermeņa svara žurnāls |
| `gym-weekly-goal` | `localStorage` | Jūsu nedēļas mērķis |
| `gym-prefs` | `localStorage` | Jūsu preferences, vārds un dzimums |
| `gym-active-session` | `localStorage` | Jebkurš iesākts treniņš, lai lapas pārlāde to nezaudētu |
| `gym-cache-owner` | `localStorage` | Kuram kontam pieder kešatmiņā saglabātie ieraksti |
| `gym-theme`, `gym-theme-vars` | `localStorage` | Jūsu tēmas izvēle un tās krāsas |
| `sb-…-auth-token` | `localStorage` | Jūsu pierakstīšanās sesija, ko iestata mūsu autentifikācijas pakalpojumu sniedzējs, lai jūs paliktu pierakstīts |
| `gym-recovery` | `localStorage` | Karodziņš, kas iestatīts tikai tad, kad jūs sekojat paroles atiestatīšanas saitei, lai neviena pārlāde, jauna cilne vai atkārtoti atvērts logs jūs neaizvestu garām atiestatīšanas ekrānam, pirms neesat iestatījis jaunu paroli. Tajā nav personas datu, un tas tiek dzēsts, kad iestatāt paroli vai izrakstāties |

**Tā nav izsekošana, un izsekošanai netiek izmantoti nekādi sīkfaili.** Neko no tā nelasa
neviens, izņemot pašu lietotni jūsu ierīcē, un nekas no tā nenonāk pie trešās puses.

Lielākā daļa tabulas ir "strikti nepieciešama" tādā nozīmē, kādā to lieto e-privātuma
direktīva — bez jūsu treniņu kešatmiņas, pierakstīšanās sesijas, iesāktā treniņa un ieraksta
par to, kuram kontam pieder kešatmiņa, bezsaistē lietojamais pakalpojums, ko jūs pieprasījāt,
vispār nedarbojas. Mēs labprātāk esam precīzi, nevis vispārīgi par pēdējām divām rindām:
jūsu **tēmas izvēle un tās krāsas** ir ērtība, nevis kaut kas, bez kā lietotne nevar
darboties, tāpēc saukt tās par strikti nepieciešamām būtu vārda izstiepšana. Mēs uzskatām
tās par pieļaujamām, jo tās neglabā par jums neko vairāk kā attēlojuma preferenci, ko jūs
pats iestatījāt, tās nekad nelasa neviens cits, un tās tiek dzēstas, kad izrakstāties — bet,
ja jūs tās labāk nevēlaties, jūsu vietnes datu notīrīšana tās noņem, un lietotne darbojas
tieši tāpat kā iepriekš, jūsu sistēmas tēmā.

Mēs nerādām nekādu piekrišanas joslu par neko no tā. Mums būtu vajadzīga jūsu piekrišana, un
mēs to lūgtu, pirms jebkā glabāšanas jūsu ierīcē analītikas vai reklāmas nolūkos, un mums
nav plānu darīt ne vienu, ne otru.

**Lai noņemtu tikai ierīces kopiju un neko citu, izrakstieties.** Izrakstīšanās notīra no
šīs pārlūkprogrammas katru `localStorage` atslēgu iepriekšējā tabulā — tostarp jūsu tēmas
izvēli un tās krāsas, kas atvasinātas no jūsu preferencēm — un jūsu pierakstīšanās sesija
tiek noņemta kopā ar tām. Tā atstāj jūsu kontu un tā datus serverī neskartus, tāpēc tā ir
pareizā izvēle koplietotā vai aizņemtā datorā. Jūsu pārlūkprogrammas "notīrīt vietnes datus"
vadīkla dara to pašu.

Iestatījumi → **Dzēst visus manus datus** ir cita un daudz lielāka darbība: tā izdzēš jūsu
treniņus, svēršanās un iestatījumus **arī serverī**, katrā ierīcē, un to nevar atsaukt. Mēs
tās nosaucām atšķirīgi apzināti — kāda agrāka šīs politikas versija otro darbību aprakstīja
kā veidu, kā notīrīt ierīces kopiju, kas ir tieši tā kļūda, kas kādam varētu maksāt viņa
treniņu vēsturi.

## 6. Kurš vēl var piekļūt jūsu datiem

**Neviens jūsu datus nepērk, nelicencē un nesaņem saviem mērķiem.** Vienīgās iesaistītās
trešās puses ir turpmāk minētie infrastruktūras pakalpojumu sniedzēji, kuri tos apstrādā
tikai pēc mūsu norādījumiem saskaņā ar rakstisku datu apstrādes līgumu (VDAR 28. pants) un
kuriem līgumiski ir aizliegts tos izmantot jebkam citam.

| Pakalpojumu sniedzējs | Ko dara | Kam var piekļūt | Apstrādes valsts |
| --- | --- | --- | --- |
| **Supabase, Inc.** | Datubāze, autentifikācija, API mitināšana | Visi konta un lietotnes dati | **Īrija** (reģions `eu-west-1`) |
| **GitHub, Inc.** (GitHub Pages) | Apkalpo lietotnes failus | Pieprasījumu žurnāli, tostarp IP adreses, ko GitHub glabā arī savas drošības nolūkos. Ne jūsu lietotnes dati | **Amerikas Savienotās Valstis**; skatiet 10. sadaļu |
| **Supabase, Inc.** (iebūvētais e-pasta pakalpojums) | Sūta paroles atiestatīšanas un apstiprināšanas e-pastu | Jūsu e-pasta adresi un ziņojumu | Pakalpojumu sniedzējs to šim pakalpojumam nepublicē. Supabase, Inc. ir reģistrēta **Amerikas Savienotajās Valstīs**; skatiet 10. sadaļu |
| **Google LLC** (Gmail) | Mitina pastkasti aiz mūsu kontaktadreses | Tikai to, ko jūs izvēlaties ievietot e-pastā mums. Lietotne tur neko nesūta, un tā neglabā jūsu treniņu, svēršanos vai konta kopiju | **Amerikas Savienotās Valstis**; skatiet 10. sadaļu |

Mēs arī izpaudīsim datus, ja mums to likumīgi liks — derīgs tiesas rīkojums, orderis vai
līdzvērtīgs juridisks process. **Mēs jūs informēsim pirms izpildes, ja vien mums to darīt
nav likumīgi aizliegts.**

Ja projekts kādreiz tiks nodots kādam citam, mēs jums to pastāstīsim, pirms jūsu dati
pārvietojas, un jūs varēsiet vispirms dzēst savu kontu.

**Mēs nekad neesam pārdevuši vai koplietojuši personas datus un to nedarīsim.** Lai novērstu
šaubas saskaņā ar ASV štatu tiesību aktiem: mēs "nepārdodam" personas informāciju, mēs to
"nekoplietojam" starpkonteksta uzvedības reklāmai, un mēs neapstrādājam sensitīvu personas
informāciju nevienam citam mērķim kā tikai jūsu pieprasītā pakalpojuma sniegšanai. Tā kā mēs
nepārdodam un nekoplietojam, Global Privacy Control signālam nav no kā atteikties; mēs šādus
signālus ievērojam jebkurā gadījumā.

## 7. Cik ilgi mēs tos glabājam

<!-- internal:start -->
> **Drafting note.** "As long as necessary" is the single most-criticised phrase in
> privacy notices and the ICO has ruled it insufficient. Every row below must name a
> duration or a concrete criterion. The backup line is the one people forget.
<!-- internal:end -->

| Dati | Glabāšana |
| --- | --- |
| Konts, treniņi, svēršanās, preferences | Līdz **jūs** tos dzēšat — vai līdz turpmāk minētais neaktivitātes noteikums izdzēš pamestu kontu jūsu vietā. Konta dzēšana visu to noņem nekavējoties un neatgriezeniski |
| **Neaktīvi konti** | **Dzēsti pēc 36 mēnešu neaktivitātes**, ar brīdinājuma e-pastu pēc 24 mēnešiem, kurā norādīts datums un tas, ka viena pierakstīšanās atiestata skaitītāju. "Neaktivitāte" nozīmē, ka visā šajā periodā nav bijusi pierakstīšanās, pierakstīts treniņš, svēršanās vai iestatījumu maiņa — lietotnes izmantošana jebkurā no šiem veidiem saglabā kontu. Mēs labprātāk dzēšam datus, kurus mums vairs neprasa glabāt, nekā pēc noklusējuma glabājam jūsu treniņu vēsturi mūžīgi. **Brīdinājums ir dzēšanas nosacījums:** ja tas jums faktiski nav nosūtīts, konts netiek dzēsts — 12 mēnešu skaitītājs sākas, kad jums to paziņo, nevis kad konts kļuva kluss |
| Konta dzēšana | Konta dzēšana datubāzes līmenī izplešas uz katru treniņa, svēršanās un iestatījumu rindu. Tā ir tūlītēja un to nevar atsaukt |
| Piekrišanas un Noteikumu pieņemšanas ieraksts (datumi un versiju numuri; nekādu veselības datu) | Tik ilgi, cik mēs apstrādājam jūsu datus, pamatojoties uz šo piekrišanu, un pēc tam tikai tik ilgi, cik mums varētu būt nepieciešams pierādīt, ka tā tika sniegta. Konta dzēšana to dzēš arī |
| Ierīces kešatmiņa (`localStorage`) | Līdz jūs izrakstāties, dzēšat visus savus datus vai notīrāt pārlūkprogrammas atmiņu. Tā paliek tikai tajā ierīcē, un tikai tajā ierīcē — mēs to nevaram izdzēst attālināti |
| Datubāzes un API pieprasījumu žurnāli (tostarp IP) | **1 diena.** Mūsu datubāzes pakalpojumu sniedzējs mūsu plānā glabā pieprasījumu žurnālus 24 stundas, pēc tam tie tiek automātiski dzēsti. Ja mēs pāriesim uz maksas plānu, šis periods kļūs garāks, un mēs šo rindu atjaunināsim |
| Statiskā mitinātāja pieprasījumu žurnāli (tostarp IP) | **To nosaka GitHub, nevis mēs.** GitHub reģistrē apmeklētāja IP adresi, kad tiek apskatīta GitHub Pages vietne, savas drošības nolūkos, un nepublicē šo žurnālu glabāšanas periodu. Tie ir GitHub ieraksti, nevis mūsu — mēs tos nevaram lasīt, eksportēt vai dzēst, un tajos nav treniņu, svēršanās vai konta datu |
| E-pasts, ko sūtāt uz mūsu kontaktadresi, un mūsu atbildes | **24 mēneši** no pēdējās ziņas sarakstē, pēc tam dzēsts no pastkastes un tās miskastes. Mēs to glabājam tikai, lai apstrādātu jūsu pieprasījumu un pierādītu, ka to apstrādājām. **Konta dzēšana to nedzēš** — palūdziet mums, un mēs dzēsīsim arī saraksti |
| **Pierakstīšanās drošības žurnāls** (tostarp IP un izmantotā e-pasta adrese) | **90 dienas.** Mūsu autentifikācijas pakalpojumu sniedzējs to glabā atsevišķi no jūsu konta un pats to neizbeidz, tāpēc **mēs to attīrām paši** šajā ritmā. Tas ir vienīgais ieraksts, kas **paliek pēc konta dzēšanas**: mēs to neizskatām saistībā ar dzēstu kontu un nekad neizmantojam tā atjaunošanai. Juridiskais pamats: 6. panta 1. punkta f) apakšpunkts — mūsu leģitīmā interese atklāt akreditācijas datu pildīšanu (credential stuffing) un pierakstīšanās galapunkta ļaunprātīgu izmantošanu |
| Sesijas pilnvaras | Līdz tās beidzas vai jūs izrakstāties — atkarībā no tā, kas notiek pirmais. Izrakstīšanās atsauc pilnvaru un noņem to no jūsu ierīces; dīkstāvē atstāta pilnvara beidzas pēc mūsu autentifikācijas pakalpojumu sniedzēja grafika, un pēc tam to izmantot nevar |
| Kļūdu ziņojumi | **Nav piemērojami.** Kļūdu ziņošana ir atspējota, tāpēc kļūdu ziņojumi netiek izveidoti vai glabāti |
| Automātiskas platformas dublējumkopijas | **Nav.** Mūsu datubāzes plāns neietver automātiskas dublējumkopijas, tāpēc datubāzes dublējuma kopijas nav |
| **Manuālas JSON dublējumkopijas** | **Nav.** Projektā ir dublēšanas skripts, taču mēs to nepalaižam pret aktīvo datubāzi. Ārpus tās jūsu datu kopijas nav |

**Mums nav dublējumkopiju, tāpēc dzēšana ir galīga brīdī, kad to veicat.** Mūsu sistēmās nav
otras jūsu datu kopijas, kurā dzēsts konts varētu saglabāties, un nav atjaunošanas ceļa, kas
to varētu atgriezt. Tas darbojas abos virzienos, un mēs labprātāk to sakām, nekā ļaujam jums
to uzzināt vēlāk: ja jūs kaut ko izdzēšat kļūdas dēļ vai ja mūsu datubāzes pakalpojumu
sniedzējs pazaudē datus, mēs tos jums nevaram atgūt. Tāpēc lietotne dod jums eksportu, ko
varat paturēt pats (Iestatījumi → Dati → Eksportēt dublējumu), un tāpēc [Noteikumu 11.
punkts](/lv/terms.html) uzliek atbildību par savas kopijas glabāšanu jums. Tas pats
apgalvojums ir [konta dzēšanas lapā](/lv/delete-account.html) un [Patērētāju veselības datu
privātuma 7. sadaļā](/consumer-health-data-privacy.html) — viena prakse, aprakstīta vienreiz,
nevis trīs solījumi, kas varētu atšķirties.

## 8. Drošība

Konkrēti pasākumi, nevis īpašības vārdi:

- Visa satiksme starp jūsu ierīci un mūsu serveriem izmanto **HTTPS/TLS**.
- Katra datubāzes tabula īsteno **rindu līmeņa drošību**: noteikums pašā datubāzē ierobežo
  katru lasīšanu un rakstīšanu līdz rindām, kuru īpašnieks sakrīt ar pierakstītā konta ID.
  To īsteno datubāze, nevis lietotnes kods, tāpēc lietojumprogrammas kļūda nevar atklāt cita
  lietotāja rindas.
- Paroles mūsu autentifikācijas pakalpojumu sniedzējs glabā tikai kā **sālītus
  jaucējkodus**. Mēs jūsu paroli neredzam.
- **Paroles maiņai ir nepieciešama jūsu pašreizējā parole.**
- Jaunām parolēm jābūt **vismaz 10 rakstzīmes** garām. Mēs prasām garumu, nevis simbolu un
  ciparu sajaukumu, jo garums ir tas, kas patiešām pretojas uzminēšanai, un sastāva
  noteikumi lielākoties rada paredzamas paroles.
- Datus mūsu datubāzes pakalpojumu sniedzējs **šifrē miera stāvoklī**.
- Piekļuve produkcijas datiem ir ierobežota līdz **vienai personai — pakalpojuma vienīgajam
  operatoram** — caur datubāzes pakalpojumu sniedzēja administratīvo konsoli. Mums nav
  darbinieku vai darbuzņēmēju, tāpēc nevienam citam mūsu pusē piekļuves nav. Mūsu datubāzes
  pakalpojumu sniedzēja personāls tehniski var piekļūt infrastruktūrai, uz kuras atrodas jūsu
  dati; šo piekļuvi regulē viņu drošības programma un 6. sadaļā minētais datu apstrādes
  līgums, kas viņiem aizliedz izmantot jūsu datus saviem mērķiem. Mēs to sakām, jo neviens
  mitināts pakalpojums nevar godīgi apgalvot pretējo, un politika, kas to noklusētu, būtu
  nepatiesa.
- **Pati lietotne neglabā nevienu akreditācijas datu, kas varētu sasniegt kāda cita rindas.**
  Pārlūkprogrammā piegādātā atslēga ir pakalpojumu sniedzēja publiskā atslēga, un katru ar to
  veikto lasīšanu un rakstīšanu ierobežo iepriekš minētā rindu līmeņa drošība. Vienīgā
  atslēga, kas var apiet šos noteikumus, nekad nav lietotnē, nekad nav publicētajos failos un
  tiek izmantota tikai bezsaistes skriptā operatora paša datorā. (Šis ir tas pats apgalvojums,
  kas [Patērētāju veselības datu privātuma 8. sadaļā](/consumer-health-data-privacy.html) —
  viens fakts, formulēts vienreiz.)

Neviena sistēma nav pilnīgi droša, un mēs to arī neapgalvojam. Mēs šeit apzināti neizmantojam
frāzes "militāra līmeņa", "nozares standarta" vai "bankas līmeņa": tās neko nenozīmē, un
regulatori tās uzskata par maldinošām.

**Ja notiek pārkāpums,** mēs:

- paziņosim attiecīgajai uzraudzības iestādei **72 stundu** laikā pēc uzzināšanas, ja
  pārkāpums varētu radīt risku jums (VDAR 33. pants);
- paziņosim **jums tieši, bez nepamatotas kavēšanās**, ja pārkāpums varētu radīt augstu risku
  jūsu tiesībām (VDAR 34. pants);
- paziņosim **jums un FTC 60 kalendāro dienu laikā** un ievērojamiem plašsaziņas līdzekļiem,
  ja vienā jurisdikcijā ir skarti 500+ cilvēku, kā to pieprasa FTC Veselības datu pārkāpumu
  paziņošanas noteikums attiecībā uz veselības lietotnēm, uz kurām neattiecas HIPAA.

<!-- internal:start -->
> **Drafting note.** The FTC amended the Health Breach Notification Rule in 2024 to cover
> exactly this kind of app, and its definition of a "breach" includes **unauthorised
> disclosure — including the operator voluntarily sharing data without consent.** That is
> how the FTC reached GoodRx and BetterHelp. If you ever add an analytics or ad SDK to a
> health app without explicit consent, that is not a policy update; it is a reportable
> breach.
<!-- internal:end -->

## 9. Jūsu tiesības

Tiesības atšķiras atkarībā no dzīvesvietas; mēs piemērojam spēcīgākās ikvienam, kur to
praktiski varam.

### Ikvienam

| Tiesības | Kā tās izmantot |
| --- | --- |
| **Piekļūt** savu datu kopijai | Iestatījumi → Dati → **Eksportēt dublējumu** dod jums JSON failu uzreiz. Tajā ir jūsu treniņi, ķermeņa svara žurnāls, nedēļas mērķis, preferences (tostarp vārds un dzimums) un konta dati — e-pasta adrese, konta izveides datums un jūsu piekrišanas un Noteikumu pieņemšanas ieraksts. Tas ir viss, ko lietotne par jums glabā. Tajā nav 2.2. sadaļā minēto infrastruktūras žurnālu — pieprasījumu žurnālu un IP adrešu, ko mūsu pakalpojumu sniedzēji glabā 7. sadaļā minētajos īsajos periodos, un pierakstīšanās laika zīmogu, ko reģistrē mūsu autentifikācijas pakalpojumu sniedzējs — kas ir tehniski ieraksti, ko glabā mūsu pakalpojumu sniedzēji, nevis lietotnes dati. Rakstiet mums, un mēs jums iegūsim to, ko tie satur |
| **Pārnesamība** — saņemt tos mašīnlasāmā formātā | Tas pats eksports. Šodien tas ir vienkāršs JSON, un [Noteikumu 11.2. punkts](/lv/terms.html) apņem mūs to uzturēt dokumentētu, mašīnlasāmu, nepatentētu un lasāmu bez FitPulse, ja formāts kādreiz mainīsies |
| **Labot** jebko nepareizu | Rediģējiet to lietotnē — vēstures ieraksti, svēršanās, vārds, preferences ir rediģējami. Lai mainītu konta e-pasta adresi, Iestatījumi → **Mainīt e-pastu**; mēs sūtām apstiprināšanas saiti gan uz veco, gan jauno adresi, tāpēc nepareizi ierakstīta adrese nevar liegt jums piekļuvi |
| **Dzēst** visu, tostarp kontu | Iestatījumi → **Dzēst kontu**. Tūlītēji, neatgriezeniski un izplešas uz katru rindu |
| **Dzēst** savus datus, bet paturēt kontu | Iestatījumi → **Dzēst visus manus datus**. Izdzēš treniņus, svēršanās un iestatījumus serverī un šajā ierīcē; pieteikšanās paliek |
| **Dzēst tikai ierīces kopiju** | **Izrakstieties** vai izmantojiet pārlūkprogrammas "notīrīt vietnes datus" vadīklu. Jūsu konts paliek neskarts |

### Ja atrodaties EEZ vai Apvienotajā Karalistē

Jums papildus ir tiesības **ierobežot** apstrādi, **iebilst** pret apstrādi, kas balstīta uz
leģitīmām interesēm, **atsaukt piekrišanu** jebkurā laikā un **nebūt pakļautam automatizētai
lēmumu pieņemšanai** (mēs tādu neveicam). Jums ir tiesības **iesniegt sūdzību uzraudzības
iestādei** — **Datu valsts inspekcijai**, Latvija, https://www.dvi.gov.lv, vai iestādei jūsu
dzīvesvietas valstī.

Mēs atbildam **viena mēneša** laikā, ko sarežģītiem pieprasījumiem var pagarināt par vēl
diviem mēnešiem, un šādā gadījumā mēs jums pirmā mēneša laikā paziņosim.

### Ja atrodaties Kalifornijā

Jums ir tiesības **zināt**, ko mēs vācam, izmantojam un izpaužam; **dzēst**; **labot**;
**atteikties no pārdošanas vai koplietošanas** (mēs nedarām ne vienu, ne otru); **ierobežot
sensitīvas personas informācijas izmantošanu** (mēs to jau izmantojam tikai jūsu pieprasītā
pakalpojuma sniegšanai, kas ir atļauts mērķis); un **netikt diskriminētam** par jebkuras no
šīm tiesībām izmantošanu. Mēs nepiedāvājam finansiālus stimulus par datiem. Iepriekšējos 12
mēnešos mēs vācām 2. sadaļā minētās kategorijas no jums 4. sadaļā minētajiem mērķiem un
izpaudām tās tikai 6. sadaļā minētajiem pakalpojumu sniedzējiem. Mēs neko nepārdevām un
nekoplietojām. FitPulse ir pieaugušajiem: mēs apzināti nevācam nevienas personas, kas jaunāka
par 18 gadiem, personas informāciju, un mēs nevienam nekad neko nepārdodam (skatiet 11.
sadaļu).

Mēs atbildam **45 dienu** laikā, ko var vienreiz pagarināt par vēl 45 dienām ar paziņojumu.
Jūs varat izmantot pilnvarotu pārstāvi; mēs lūgsim viņam rakstisku pilnvarojuma pierādījumu
un lūgsim jums to apstiprināt. Mēs pārbaudām pieprasījumus, prasot jums rīkoties no
pierakstītā konta vai reģistrētās e-pasta adreses — mēs neprasām personu apliecinošus
dokumentus.

### Ja atrodaties Vašingtonas štatā

Skatiet [Patērētāju veselības datu privātuma politiku](/consumer-health-data-privacy.html).
Jums ir tiesības apstiprināt, vai mēs vācam jūsu patērētāja veselības datus, un piekļūt tiem,
tostarp to trešo pušu sarakstam, ar kurām tie tika koplietoti, atsaukt piekrišanu un panākt
to dzēšanu no visiem mūsu ierakstiem, tostarp dublējumkopijām. Mēs atbildam **45 dienu**
laikā, ko var pagarināt par 45, un, ja mēs pieprasījumu noraidām, jūs varat to **pārsūdzēt**,
uz ko mēs atbildam rakstiski 45 dienu laikā; ja pārsūdzība tiek noraidīta, jūs varat
sūdzēties Vašingtonas ģenerālprokuroram.

### Ja atrodaties citur ASV

Virdžīnija, Kolorādo, Konektikuta, Teksasa, Oregona un pārējie štati ar visaptverošiem
privātuma likumiem piešķir būtībā tās pašas tiesības — piekļuve, labošana, dzēšana,
pārnesamība, atteikšanās no mērķētas reklāmas un pārdošanas, kā arī piekrišana pirms
sensitīvu datu apstrādes. Izmantojiet tos pašus iepriekš minētos mehānismus; mēs tos
piemērojam neatkarīgi no jūsu dzīvesvietas.

**Lai iesniegtu jebkuru pieprasījumu:** izmantojiet lietotnes pogas vai rakstiet uz
**smalkaisk@gmail.com**. Pieprasījumi ir bez maksas. Mēs neprasīsim jums izveidot kontu, lai
to iesniegtu.

## 10. Starptautiskie datu nosūtīšanas gadījumi

**Jūsu konts, treniņi, svēršanās un preferences tiek glabāti un apstrādāti Īrijā**, mūsu
datubāzes pakalpojumu sniedzēja `eu-west-1` reģionā. Īrija atrodas Eiropas Ekonomikas zonā,
tāpēc šie dati netiek nosūtīti ārpus EEZ, un tiem nav nepieciešams atsevišķs nosūtīšanas
mehānisms.

Divi šaurāki jautājumi, kas norādīti, nevis apieti:

- **Paroles atiestatīšanas un apstiprināšanas e-pastu** sūta mūsu datubāzes pakalpojumu
  sniedzēja iebūvētais e-pasta pakalpojums. Tas satur jūsu e-pasta adresi un ziņojuma tekstu
  — nekad jūsu treniņus vai svaru. Mūsu pakalpojumu sniedzējs nepublicē reģionu, kurā darbojas
  tā koplietotā e-pasta infrastruktūra, un tas ir Amerikas Savienoto Valstu uzņēmums, tāpēc
  mēs to uzskatām par nosūtīšanu ārpus EEZ. Uz to attiecas Eiropas Komisijas apstiprinātās
  **standarta līguma klauzulas**, kas ir daļa no mūsu pakalpojumu sniedzēja datu apstrādes
  līguma. Pēc pieprasījuma mēs jums nosūtīsim kopiju. Tas attiecas tikai uz jūsu e-pasta
  adresi — nekad uz jūsu veselības datiem, kas paliek Īrijā, kā aprakstīts iepriekš.

<!-- internal:start -->
> **Action before launch.** Download Supabase's Data Processing Addendum, confirm it
> incorporates the SCCs, and keep a copy — the sentence above promises one on request, and
> § 6 states that every processor operates under a written Art. 28 agreement. Neither claim
> is safe until you hold the document.
<!-- internal:end -->
- **E-pasts, ko jūs mums sūtāt.** Mūsu kontaktadrese ir Gmail pastkaste, tāpēc Google LLC —
  Amerikas Savienoto Valstu uzņēmums — apstrādā jebkuru ziņu, ko jūs mums sūtāt, tostarp visu,
  ko izvēlaties tajā ievietot. Nosūtīšanu sedz ES–ASV Datu privātuma sistēma un Google
  noteikumos ietvertās standarta līguma klauzulas. Lietotne tur neko nesūta: tas attiecas
  tikai uz saraksti, ko jūs uzsākat. Ja jūs labāk nevēlaties nosūtīt privātuma pieprasījumu
  caur Google, pasakiet to pirmajā ziņā bez detaļām, un mēs sarunāsim citu veidu.
- **Statiskā mitināšana.** Lietotnes failus apkalpo **GitHub Pages**, ko nodrošina **GitHub,
  Inc.** Amerikas Savienotajās Valstīs. Tā kā tā ir ārpus EEZ, nosūtīšana balstās uz GitHub
  pašsertifikāciju saskaņā ar **ES–ASV Datu privātuma sistēmu** un uz **standarta līguma
  klauzulām**, kas iekļautas GitHub Datu aizsardzības līgumā. Mitinātājs apkalpo lietotnes
  failus un redz pieprasījumu žurnālus, tostarp IP adreses; tas nekad neglabā jūsu ierakstus.

**Apvienotās Karalistes lietotājiem** piemēro to pašu glabāšanu. Nosūtīšanu no Apvienotās
Karalistes uz Īriju sedz Apvienotās Karalistes aizsardzības līmeņa pietiekamības noteikumi
attiecībā uz EEZ, tāpēc papildu aizsardzības pasākums nav nepieciešams.

## 11. Bērni

FitPulse nav paredzēta nevienam, kas jaunāks par **18** gadiem, un Lietošanas noteikumi
nosaka to pašu robežu (4.1. punkts) — konta izveidei ir jāapstiprina, ka esat 18 gadus vecs
vai vecāks. Mēs apzināti nevācam datus no bērniem. Ja jūs uzskatāt, ka bērns ir izveidojis
kontu, rakstiet uz **smalkaisk@gmail.com**, un mēs to un tā datus nekavējoties izdzēsīsim.
Mēs nerādām reklāmas un mums nav trešo pušu analītikas, tāpēc pat tādā gadījumā nekas par
bērna datiem nekur netiktu pārsūtīts.

## 12. Izmaiņas šajā politikā

Mēs augšpusē uzturam versijas numuru un spēkā stāšanās datumu, un katra iepriekšējā versija
tiek glabāta projekta Git vēsturē. Rakstiet mums, un mēs jums nosūtīsim jebkuru agrāku
versiju.

**Versijas numurs mainās ikreiz, kad mainās teksts.** Tas izklausās pašsaprotami un ir viegli
sajaukt: versija 1.0 pēc publicēšanas tika rediģēta, lai pievienotu jaunu saņēmēju — Google
pastkastei aiz mūsu kontaktadreses — kamēr galvenē joprojām bija norādīts 1.0. Neviens netika
skarts, jo lietotnei vēl nebija lietotāju, taču versijas numurs, kas paliek nemainīgs, kamēr
teksts mainās, nevar jums pateikt, kam jūs piekritāt, kas ir vienīgais, kam tas ir domāts.
Tāpēc noteikums tagad ir skaidrs: versija, spēkā stāšanās datums un versijas numura kopija,
ko lietotne reģistrē pret jūsu kontu, mainās tajā pašā rediģēšanā, kad vārdi.

- **Nelieli labojumi** (drukas kļūdas, skaidrāks formulējums, jauna adrese) stājas spēkā pēc
  publicēšanas.
- **Būtiskas izmaiņas** — jauns mērķis, jauns saņēmējs, jauns datu veids, garāks glabāšanas
  periods — tiks paziņotas **iepriekš**, ar vienkāršu kopsavilkumu par to, kas mainījies,
  pirms tās stājas spēkā. Paziņojums parādās **lietotnē**, kas ir ceļš, ko mēs vienmēr varam
  veikt, **un pa e-pastu** uz jūsu reģistrēto adresi, ja mēs varam to nosūtīt. Ja izmaiņai ir
  nepieciešama jūsu piekrišana, mēs to lūdzam lietotnē, tāpēc ziņa, kas jūs nekad nesasniedza,
  nevar jums maksāt iespēju to apsvērt.
- Ja izmaiņa skar jūsu **veselības datus** — jauna kategorija, jauns mērķis vai jauns
  saņēmējs — mēs vispirms iegūsim jūsu **apstiprinošu piekrišanu**, kā to pieprasa My Health
  My Data Act. Mēs nepiemērosim izmaiņu veselības datiem, kas savākti saskaņā ar agrāku šīs
  politikas versiju, jums neprasot.
- Mēs pārskatām šo politiku vismaz **reizi 12 mēnešos**, pat ja nekas nav mainījies, un
  atjauninām iepriekš norādīto "pēdējoreiz pārskatīts" datumu.

Mēs nekad neveiksim būtisku izmaiņu klusi un nepaļausimies uz jūsu turpmāko lietošanu kā
piekrišanu. To īsteno lietotne, nevis tikai sola šeit: katrai šīs politikas un Noteikumu
versijai ir numurs, jūsu piekrišana tiek reģistrēta pret numuriem, kuriem jūs faktiski
piekritāt, un, kad jauna versija stājas spēkā, lietotne apstājas pie ekrāna, kurā tiek lūgts
to izlasīt un apstiprināt — ar veselības datu piekrišanu kā atsevišķu atzīmi, tieši tāpat kā
reģistrējoties — pirms jūs dodaties tālāk.

## 13. Kontakti

- **Privātuma jautājumi un pieprasījumi:** **smalkaisk@gmail.com**
- **Pasta adrese:** Klusā iela 2a, Rīga, LV-1007, Latvija
- **Uzraudzības iestāde (EEZ/AK):** **Datu valsts inspekcija**, Latvija, https://www.dvi.gov.lv
- **Vašingtonas ģenerālprokurors (MHMDA sūdzības):** https://www.atg.wa.gov/file-complaint

Mēs cenšamies atbildēt uz katru ziņu **10 darba dienu** laikā un jebkurā gadījumā 9. sadaļā
noteiktajos likumā paredzētajos termiņos.

---

*Privātuma politikas beigas, versija 1.1.*
