// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataFlowSection } from '../src/components/DataFlowSection';
import { ImpactSection } from '../src/components/ImpactSection';
import { LiveDashboardSection } from '../src/components/LiveDashboardSection';
import { Navbar } from '../src/components/Navbar';
import { OverflowReportDrawer } from '../src/components/OverflowReportDrawer';
import { INITIAL_ALERTS, INITIAL_CAMPUS_BINS } from '../src/data/gcetOsmData';

describe('GCET SmartWaste Frontend Components & User Flows', () => {
  it('toggles accessible mobile navigation menu in Navbar', () => {
    const onOpenReport = vi.fn();
    render(<Navbar onOpenReportDrawer={onOpenReport} />);

    const menuBtn = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /report overflow/i }));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
  });

  it('renders all 5 data flow visualization stages', () => {
    render(<DataFlowSection />);
    expect(screen.getByText('Student Throws Waste')).toBeInTheDocument();
    expect(screen.getByText('Smart Bin Sensor Detects Fill Level')).toBeInTheDocument();
    expect(screen.getByText('Data Transmitted to Cloud')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Receives Data')).toBeInTheDocument();
    expect(screen.getByText('Collection Team Gets Alert')).toBeInTheDocument();
  });

  it('filters bins by zone and triggers interactive dashboard actions', () => {
    const onSimulate = vi.fn();
    const onFlag = vi.fn();
    const onDispatch = vi.fn();
    const onEmpty = vi.fn();
    const onDismiss = vi.fn();
    const onOpenDrawer = vi.fn();

    render(
      <LiveDashboardSection
        bins={INITIAL_CAMPUS_BINS}
        alerts={INITIAL_ALERTS}
        onSimulateSensorCycle={onSimulate}
        onFlagOverflow={onFlag}
        onDispatchCrew={onDispatch}
        onMarkEmptied={onEmpty}
        onDismissAlert={onDismiss}
        onOpenReportDrawer={onOpenDrawer}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /pulse live sensor update/i }));
    expect(onSimulate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dining & Plaza' }));
    expect(screen.getAllByText('Central Canteen Courtyard').length).toBeGreaterThan(0);
    expect(screen.queryByText('Academic Block A Atrium')).not.toBeInTheDocument();
  });

  it('validates and submits student overflow reports inside OverflowReportDrawer', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      id: 'rpt-test',
      ticketNumber: 'GCET-RPT-9911',
      binId: 'bin-102',
      binCode: 'GCET-BIN-102',
      location: 'Central Canteen Courtyard',
      reporterName: 'Rohan Singh',
      campusId: '2300970100084',
      role: 'Student',
      issueType: 'Bin Overflowing',
      urgency: 'Urgent',
      notes: 'Near gate',
      createdAt: '11:15 AM',
      status: 'Pending Dispatch',
    });

    render(
      <OverflowReportDrawer
        isOpen={true}
        bins={INITIAL_CAMPUS_BINS}
        onClose={vi.fn()}
        onSubmitReport={onSubmit}
        onJumpToDashboard={vi.fn()}
      />
    );

    // Invalid submission should show inline validation error
    fireEvent.click(screen.getByRole('button', { name: /submit overflow report/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 2 characters/i);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Rohan Singh' },
    });
    fireEvent.change(screen.getByLabelText(/roll number/i), {
      target: { value: '2300970100084' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit overflow report/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByText('GCET-RPT-9911')).toBeInTheDocument();
    });
  });

  it('renders all 4 campus impact pillars cleanly', () => {
    render(<ImpactSection onOpenReportDrawer={vi.fn()} />);
    expect(screen.getByText('Reduced Overflow')).toBeInTheDocument();
    expect(screen.getByText('Cleaner Campus')).toBeInTheDocument();
    expect(screen.getByText('Faster Waste Collection')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Environment')).toBeInTheDocument();
  });

  it('renders campus-only Google Maps satellite views without off-campus Metro station clutter', async () => {
    const { CampusOverviewMap } = await import('../src/components/CampusOverviewMap');
    const { SmartBinDeploymentSection } = await import('../src/components/SmartBinDeploymentSection');
    const { RouteOptimizationSection } = await import('../src/components/RouteOptimizationSection');
    const { MapsAvailabilityContext } = await import('../src/components/CampusMapContext');

    render(
      <MapsAvailabilityContext.Provider value={{ hasApiKey: false, isResolvingKey: false }}>
        <CampusOverviewMap />
        <SmartBinDeploymentSection bins={INITIAL_CAMPUS_BINS} />
        <RouteOptimizationSection
          bins={INITIAL_CAMPUS_BINS}
          onMarkBinCollected={vi.fn()}
          onResetRouteScenario={vi.fn()}
        />
      </MapsAvailabilityContext.Provider>
    );

    expect(screen.queryByText(/Knowledge Park II Metro/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Google Maps Satellite View \(GCET Campus\)/i).length).toBe(3);
    expect(screen.getByRole('button', { name: /Recenter Campus/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Optimal Route/i })).toBeInTheDocument();
  });
});
