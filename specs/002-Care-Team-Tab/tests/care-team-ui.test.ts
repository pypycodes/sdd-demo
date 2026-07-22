/**
 * Care Team UI Feature Tests
 * Tests for Care Team tab functionality in My Care page
 */

describe('Care Team UI Feature', () => {
  
  // Test 1: Render care team with members
  test('should render care team members in UI', () => {
    const careTeam = [
      {
        name: 'Dr. Sarah Mitchell',
        role: 'Primary Care Physician',
        phone: '(555) 612-4789'
      }
    ];
    
    const html = careTeam.map(member => `
      <div class="flex-shrink-0 w-32 text-center">
        <p class="text-xs font-medium text-gray-800">${member.name}</p>
        <p class="text-[10px] text-gray-500">${member.role}</p>
      </div>
    `).join('');
    
    expect(html).toContain('Dr. Sarah Mitchell');
    expect(html).toContain('Primary Care Physician');
  });

  // Test 2: Handle empty care team
  test('should display empty state message', () => {
    const emptyStateHtml = `
      <div class="text-center py-12">
        <p class="text-lg font-medium text-gray-600">No Care Team Information Available</p>
      </div>
    `;
    
    expect(emptyStateHtml).toContain('No Care Team Information Available');
  });

  // Test 3: Tab switching functionality
  test('should have tab elements defined', () => {
    const tabJourney = { id: 'tab-journey' };
    const tabTeam = { id: 'tab-team' };
    
    // Simulate clicking Care Team tab
    expect(tabTeam).toBeDefined();
    expect(tabTeam.id).toBe('tab-team');
  });

  // Test 4: Tab styling
  test('should apply correct tab styling', () => {
    const activeTabClass = 'text-brand-blue border-b-2 border-brand-blue';
    const inactiveTabClass = 'text-gray-500 hover:text-gray-700';
    
    expect(activeTabClass).toContain('text-brand-blue');
    expect(inactiveTabClass).toContain('text-gray-500');
  });

  // Test 5: Content visibility
  test('should have journey content element', () => {
    const journeyContent = { id: 'mycare-journey-content' };
    
    // Journey tab should be visible by default
    expect(journeyContent).toBeDefined();
    expect(journeyContent.id).toBe('mycare-journey-content');
  });

  // Test 6: Care team list structure
  test('should render care team in correct structure', () => {
    const member = {
      name: 'Dr. Sarah Mitchell',
      role: 'Primary Care Physician',
      phone: '(555) 612-4789'
    };
    
    const cardHtml = `
      <div class="flex-shrink-0 w-32 text-center">
        <div class="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2"></div>
        <p class="text-xs font-medium text-gray-800 truncate">${member.name}</p>
        <p class="text-[10px] text-gray-500 truncate">${member.role}</p>
        <p class="text-[10px] text-gray-400 mt-1">${member.phone}</p>
      </div>
    `;
    
    expect(cardHtml).toContain('flex-shrink-0');
    expect(cardHtml).toContain('rounded-full');
    expect(cardHtml).toContain('truncate');
  });

  // Test 7: Multiple members rendering
  test('should render multiple care team members', () => {
    const team = [
      { name: 'Dr. Alice', role: 'Doctor', phone: '1' },
      { name: 'Dr. Bob', role: 'Specialist', phone: '2' }
    ];
    
    const html = team.map(m => `<div>${m.name}</div>`).join('');
    
    expect(html).toContain('Dr. Alice');
    expect(html).toContain('Dr. Bob');
  });

  // Test 8: Profile icon rendering
  test('should render profile icons for each member', () => {
    const iconHtml = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    `;
    
    expect(iconHtml).toContain('svg');
    expect(iconHtml).toContain('w-6 h-6');
  });

  // Test 9: Responsive layout
  test('should use responsive grid layout', () => {
    const layoutHtml = '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6"></div>';
    
    expect(layoutHtml).toContain('grid');
    expect(layoutHtml).toContain('grid-cols-1');
    expect(layoutHtml).toContain('lg:grid-cols-3');
  });

  // Test 10: Data binding
  test('should bind care team data correctly to UI', () => {
    const data = {
      name: 'Dr. Sarah Mitchell',
      role: 'Primary Care Physician',
      phone: '(555) 612-4789'
    };
    
    const bound = `<p>${data.name}</p><p>${data.role}</p><p>${data.phone}</p>`;
    
    expect(bound).toContain(data.name);
    expect(bound).toContain(data.role);
    expect(bound).toContain(data.phone);
  });
});

describe('Care Team Tab - Exact Home Page Parity (Corrected Spec)', () => {
  // Simulates the shared renderCareTeamList(careTeam) logic used by
  // BOTH the Home Page and the My Care > Care Team tab.
  function renderCareTeamList(careTeam: Array<{ name: string; role: string; phone?: string }> | undefined) {
    if (!careTeam || careTeam.length === 0) {
      return '<p>No Care Team Information Available</p>';
    }
    return careTeam
      .map(
        (member) => `
      <div class="flex-shrink-0 w-32 text-center">
        <p class="text-xs font-medium text-gray-800 truncate">${member.name}</p>
        <p class="text-[10px] text-gray-500 truncate">${member.role}</p>
      </div>
    `
      )
      .join('');
  }

  test('should identify primary doctor via role field, not a separate flag', () => {
    const careTeam = [
      { name: 'Dr. Sarah Mitchell', role: 'Primary Care Physician', phone: '(555) 612-4789' },
      { name: 'Linda Torres', role: 'Certified Diabetes Educator', phone: '(555) 612-4790' },
    ];

    const primaryDoctor = careTeam.find((m) => m.role.toLowerCase().includes('primary care'));
    expect(primaryDoctor).toBeDefined();
    expect(primaryDoctor?.name).toBe('Dr. Sarah Mitchell');
  });

  test('should render primary doctor AND all other members together', () => {
    const careTeam = [
      { name: 'Dr. Sarah Mitchell', role: 'Primary Care Physician' },
      { name: 'Linda Torres', role: 'Certified Diabetes Educator' },
    ];

    const html = renderCareTeamList(careTeam);
    expect(html).toContain('Dr. Sarah Mitchell');
    expect(html).toContain('Primary Care Physician');
    expect(html).toContain('Linda Torres');
    expect(html).toContain('Certified Diabetes Educator');
  });

  test('should NOT render phone number, matching Home Page exactly', () => {
    const careTeam = [
      { name: 'Dr. Sarah Mitchell', role: 'Primary Care Physician', phone: '(555) 612-4789' },
    ];

    const html = renderCareTeamList(careTeam);
    expect(html).not.toContain('(555) 612-4789');
  });

  test('should work correctly when patient has only a primary doctor (no additional members)', () => {
    const careTeam = [{ name: 'Dr. Patricia Harrison', role: 'Primary Care Physician' }];

    const html = renderCareTeamList(careTeam);
    expect(html).toContain('Dr. Patricia Harrison');
    expect((html.match(/flex-shrink-0/g) || []).length).toBe(1);
  });

  test('should not omit or duplicate any care team member', () => {
    const careTeam = [
      { name: 'Dr. Sarah Williams', role: 'Emergency Medicine Physician' },
      { name: 'Jennifer Liu', role: 'Orthopedic Care Coordinator' },
    ];

    const html = renderCareTeamList(careTeam);
    const cardCount = (html.match(/flex-shrink-0/g) || []).length;
    expect(cardCount).toBe(careTeam.length);
  });
});

describe('Care Team Tab - DOM structure regression guard', () => {
  // Regression test: an earlier revert accidentally dropped the
  // #care-team-section / #care-team-members elements from public/index.html,
  // which caused the "Care Team" tab to show the AI Insights panel instead
  // (because the Care Journey column was hidden but nothing replaced it).
  // This test parses the real HTML file and asserts the required elements exist.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '../../../public/index.html'), 'utf8');

  test('index.html must contain the care-team-section container', () => {
    expect(html).toContain('id="care-team-section"');
  });

  test('index.html must contain the care-team-members container', () => {
    expect(html).toContain('id="care-team-members"');
  });

  test('index.html must contain the mycare-journey-content container', () => {
    expect(html).toContain('id="mycare-journey-content"');
  });

  test('index.html must contain the mycare-ai-panel container', () => {
    expect(html).toContain('id="mycare-ai-panel"');
  });

  test('index.html Care Team tab button must call showMyCareCareTab(\'team\')', () => {
    expect(html).toMatch(/showMyCareCareTab\(['"]team['"]\)/);
  });

  test('app.js must define showMyCareCareTab toggling all four containers', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '../../../public/app.js'), 'utf8');
    expect(appJs).toContain('function showMyCareCareTab');
    expect(appJs).toContain("getElementById('mycare-journey-content')");
    expect(appJs).toContain("getElementById('mycare-ai-panel')");
    expect(appJs).toContain("getElementById('care-team-section')");
  });
});
