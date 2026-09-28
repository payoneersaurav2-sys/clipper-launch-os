const fs = require('fs');

let content = fs.readFileSync('apps/web/src/layouts/AgencyLayout.tsx', 'utf8');

// add import for useAuthStore and UpgradePrompt
if (!content.includes('useAuthStore')) {
  content = content.replace("import { cn } from '@/lib/utils';", "import { cn } from '@/lib/utils';\nimport { useAuthStore } from '@/stores/useAuthStore';\nimport { UpgradePrompt } from '@/components/UpgradePrompt';");
}

// add hook usage
if (!content.includes('const { subscriptionTier } = useAuthStore();')) {
  content = content.replace("const [mobileOpen, setMobileOpen] = useState(false);", "const [mobileOpen, setMobileOpen] = useState(false);\n  const { subscriptionTier } = useAuthStore();\n  const isAgency = subscriptionTier === 'agency';");
}

// modify main content area
const outletString = "<main className=\"flex-1 overflow-y-auto overflow-x-hidden\">\n          <Outlet />\n        </main>";
const replaceString = `<main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {isAgency ? <Outlet /> : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
              <UpgradePrompt 
                feature="Agency HQ" 
                requiredPlan="agency"
                description="Upgrade to the Agency tier to unlock white-labeling, client workspaces, multi-brand AI context switching, and team management."
              />
            </div>
          )}
        </main>`;

content = content.replace(outletString, replaceString);

// Also add a little PRO badge to the sidebar link in DashboardLayout
let dashboardContent = fs.readFileSync('apps/web/src/layouts/DashboardLayout.tsx', 'utf8');
dashboardContent = dashboardContent.replace(
  "{ name: 'Agency HQ', href: '/agency', icon: Shield },",
  "{ name: 'Agency HQ', href: '/agency', icon: Shield, badge: useAuthStore.getState().subscriptionTier !== 'agency' ? 'PRO' : undefined },"
);
fs.writeFileSync('apps/web/src/layouts/DashboardLayout.tsx', dashboardContent);


fs.writeFileSync('apps/web/src/layouts/AgencyLayout.tsx', content);
console.log('patched');
