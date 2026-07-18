require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const updates = [
  // Chambers 11
  { unitSlug: 'chambers-11-1', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1405760487252754836.ics?t=1c5641239d0c4a8da790a8f7e1553fc8', icalVrboUrl: 'http://www.vrbo.com/icalendar/5ac9c005e7644cfb928e5c7036b32735.ics?nonTentative' },
  { unitSlug: 'chambers-11-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1326214630233467935.ics?t=ec9a655a33c3404eaf01fd20e0deffc5', icalVrboUrl: 'http://www.vrbo.com/icalendar/8f48c847f21c4bb0b9f4611c1603f172.ics?nonTentative' },
  { unitSlug: 'chambers-11-3', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1451366002459470281.ics?t=54c012a14e954c51ade12b9237645555', icalVrboUrl: 'http://www.vrbo.com/icalendar/1e1e454421f14375b29dbfa9194c5299.ics?nonTentative' },
  { unitSlug: 'chambers-11-4', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1443690235137722831.ics?t=512b05e5b27147f89427c18414aeeb19', icalVrboUrl: 'http://www.vrbo.com/icalendar/8739e3a6452b4c20adeb4f98e2891c42.ics?nonTentative' },
  { unitSlug: 'chambers-11-5', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1060293464003060314.ics?t=d2efe15dbf9d42f3b80dab3ef45a142c', icalVrboUrl: 'http://www.vrbo.com/icalendar/63524b0fb2e24bccb901d0b029bfdbf1.ics?nonTentative' },
  { unitSlug: 'chambers-11-1-11-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1476802741928800187.ics?t=d4ad8c4c221548c88edbb1499a226e89', icalVrboUrl: null },
  // Chambers 9
  { unitSlug: 'chambers-9-1', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1028407531830687137.ics?t=b7b573b6b01544a0b060fe4089dd2eb0', icalVrboUrl: 'http://www.vrbo.com/icalendar/fe55536ad3fc40df98351e22f8ff7efb.ics?nonTentative' },
  { unitSlug: 'chambers-9-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1379187539109832052.ics?t=b6ddb865313243e18a8345af90897f6d', icalVrboUrl: 'http://www.vrbo.com/icalendar/0ec22d89f7d446589c72bec9ce7fb8f7.ics?nonTentative' },
  { unitSlug: 'chambers-9-7', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1289976821785175727.ics?t=ead1a8b0b0134f3cade916bb1158fc6a', icalVrboUrl: 'http://www.vrbo.com/icalendar/f2779262742446de818e62d9790f1ccc.ics?nonTentative' },
  { unitSlug: 'chambers-9-8', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1686212125403524449.ics?t=7e45e1873e924a0e995e855da8737a4e', icalVrboUrl: null },
  { unitSlug: 'chambers-9-9', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/951643630831647003.ics?t=af1d908040964f0c9a9381a37b5d2c1f', icalVrboUrl: 'http://www.vrbo.com/icalendar/0293a75117644b73946d833809e681c6.ics?nonTentative' },
  { unitSlug: 'chambers-7-9', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1313190347252631383.ics?t=3a2b157c1d654984a460acbd6be6979c', icalVrboUrl: null },
  { unitSlug: 'chambers-9-1-9-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1607949884911974599.ics?t=e0dfaeeeaf544a09b9599317a1f2e439', icalVrboUrl: null },
  // JDS
  { unitSlug: 'jds-3', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/44141614.ics?t=00493c95293b45e8961324f93fb26c86', icalVrboUrl: 'http://www.vrbo.com/icalendar/745d0c40bf6f4d93aad15779b78a8bf0.ics?nonTentative' },
  { unitSlug: 'jds-4', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/35218567.ics?t=b823ec0222fb40dc934cbfed2a9f5f03', icalVrboUrl: 'http://www.vrbo.com/icalendar/073ebb63139e4ee7851f525bb3ce7f4b.ics?nonTentative' },
  { unitSlug: 'jds-1-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/51610818.ics?t=b1113fa4d90a49c4926e08b35b74e634', icalVrboUrl: null },
  { unitSlug: 'jds-3-4', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/44128651.ics?t=633ea8323d8247f4924eca3310a4d7c6', icalVrboUrl: null },
  // Wood Street
  { unitSlug: 'wood-st-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1425946091140356545.ics?t=48120d4e01994fae9269979b3e1eb5ce', icalVrboUrl: 'http://www.vrbo.com/icalendar/433425cdba1e4683b6941a9bb0a0f4f4.ics?nonTentative' },
  { unitSlug: 'wood-st-3', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1471676597124471366.ics?t=3132eb133a834155befaefa17335b91f', icalVrboUrl: null },
  // WSC
  { unitSlug: '20-1-wsc', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1523978018503532881.ics?t=a54c9f6007c74176aa4139abb462c21d', icalVrboUrl: null },
  { unitSlug: '20-2-wsc', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1523922798240522995.ics?t=21c4af592c21459ebb3c81df25d7dafe', icalVrboUrl: null },
  { unitSlug: '20-3-wsc', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1523956559132675863.ics?t=6f21a450ad66409aaa1f1e97499f5d8b', icalVrboUrl: null },
  { unitSlug: '22-4-wsc', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1521765380778708080.ics?t=386c0649d3164950af843d7fa61812e1', icalVrboUrl: null },
  { unitSlug: '22-5-wsc', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1522455244829831002.ics?t=83dc6a5d3cad47a8abfd9095debd71a5', icalVrboUrl: null },
  { unitSlug: '22-6-wsc', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1517332573480357530.ics?t=4461df4dca224c86b4aa6e3d89cea8db', icalVrboUrl: null },
  { unitSlug: 'wood-street-collective-full-house', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1594918404152580741.ics?t=a5caf1d9d00546808f368dbfe5eef9fa', icalVrboUrl: null },
  // Ancoats
  { unitSlug: 'redbrick-mill-4', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1394030492114500585.ics?t=1b928266fb87493197193a22549e92c4', icalVrboUrl: 'http://www.vrbo.com/icalendar/fc7cd0c2b5a14953955b6c1cad7fe694.ics?nonTentative' },
  { unitSlug: 'redbrick-mill-2', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1399217171891871955.ics?t=21035d2493b04c9fa6854b8f0fbf3e4b', icalVrboUrl: 'http://www.vrbo.com/icalendar/0e1aa85c68cd4657b31d0edc14e3ca8c.ics?nonTentative' },
  { unitSlug: 'sezas-conversion', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/35638994.ics?t=8d47ee806c7f45d9a489fb0bd2c7e5ac', icalVrboUrl: 'http://www.vrbo.com/icalendar/c1295ee29f784d52a1f320eb88af7b5c.ics?nonTentative' },
  { unitSlug: 'ancoats-14', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/728689465990557007.ics?t=469d8d85cc9f4553936cf17358fa71ee', icalVrboUrl: null },
  { unitSlug: 'ancoats-15', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1613050290423156598.ics?t=dbbf5b33c7174392a2031e8b7771f7b0', icalVrboUrl: null },
  { unitSlug: '21-loft-conversion', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1087597518240639223.ics?t=9bbc0284a82640b1a81bdb553b8aa1db', icalVrboUrl: 'http://www.vrbo.com/icalendar/d0e15044fe1b47048707e42f2bef7d6a.ics?nonTentative' },
  { unitSlug: 'mill-conversion-3', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1513561317507436157.ics?t=570a85e658bd46bf8c921609e9a216ab', icalVrboUrl: null },
  { unitSlug: 'mill-conversion-8', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/52154638.ics?t=9d8cb7959383458eb1c561a5d1bf01b9', icalVrboUrl: 'http://www.vrbo.com/icalendar/95bacb1490b6472688427bbad0c8c29c.ics?nonTentative' },
  { unitSlug: 'ancoats-pop-5', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/37374503.ics?t=d173457b3f4f4e24b2bb9511e6c79137', icalVrboUrl: null },
  { unitSlug: 'mill-conversion-6', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1245040143495249790.ics?t=01b7152f933b471a8bfcf7146aa159e5', icalVrboUrl: 'http://www.vrbo.com/icalendar/2dbca1abb51b4016ba0a13d2574411b7.ics?nonTentative' },
  { unitSlug: 'lockgate-504', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/1625359841710222441.ics?t=310dfbf9a4084cfbb18766076f320d80', icalVrboUrl: null },
  // Trafford
  { unitSlug: 'oldtraford', icalAirbnbUrl: 'https://www.airbnb.co.uk/calendar/ical/53210544.ics?t=8ad7743681c64dc99d7c3dd1db7d6fb1', icalVrboUrl: null },
];

async function main() {
  let ok = 0, failed = 0;
  for (const { unitSlug, icalAirbnbUrl, icalVrboUrl } of updates) {
    const { error } = await supabase
      .from('Unit')
      .update({ icalAirbnbUrl, icalVrboUrl })
      .eq('unitSlug', unitSlug);
    if (error) {
      console.error('  FAIL', unitSlug, error.message);
      failed++;
    } else {
      console.log('  OK  ', unitSlug);
      ok++;
    }
  }
  console.log(`\nDone: ${ok} updated, ${failed} failed`);
}

main();
