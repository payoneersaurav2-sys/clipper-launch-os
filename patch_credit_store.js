const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/CreditStorePage.tsx', 'utf8');

// Remove the `!whopId` banner section
content = content.replace(/\{!whopId && \([\s\S]*?\)\}/, '');

// Simplify the buy button
content = content.replace(
  /<Button className="mt-auto h-11 w-full" onClick=\{\(\) => whopId \? window.location\.assign\(checkoutWithPassthrough\(pack\.checkoutUrl\)\) : connectWhop\(\)\} disabled=\{linkingWhop\}>\{whopId \? 'Buy Credits' : 'Connect Whop to Buy'\}<\/Button>/,
  '<Button className="mt-auto h-11 w-full" onClick={() => window.location.assign(checkoutWithPassthrough(pack.checkoutUrl))}>Buy Credits</Button>'
);

// Remove `connectWhop` and `whopId` and `linkingWhop` state from the component
content = content.replace(/const \[linkingWhop, setLinkingWhop\] = useState\(false\);/, '');
content = content.replace(/const connectWhop = async \(\) => \{[\s\S]*?\};/, '');
content = content.replace(/const whopId = user\?\.user_metadata\?\.whop_id;/, '');

fs.writeFileSync('apps/web/src/pages/CreditStorePage.tsx', content);
console.log('patched credit store');
