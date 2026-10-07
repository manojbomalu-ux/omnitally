import React, { useEffect, useState } from 'react';

interface Props {
  slug: string;
  title: string;
  currency: string; // "$", "£", or "A$"
  optimizationRule?: string;
  staticBreakdown?: Array<any>; // Will vary by tool type
  faqItems?: Array<{ question: string; answer: string }>;
  defaultV1: number;
  defaultV2: number;
  mode: string;
}

export function Calculator({
  slug,
  title,
  currency,
  optimizationRule,
  staticBreakdown,
  faqItems,
  defaultV1,
  defaultV2,
  mode
}: Props) {
  // State variables as specified in the requirements
  const [val1, setVal1] = useState<number>(defaultV1);
  const [val2, setVal2] = useState<number>(defaultV2);
  const [modeState, setModeState] = useState<string>(mode);
  const [freq, setFreq] = useState<'annual' | 'monthly' | 'weekly'>('annual');
  const [calculations, setCalculations] = useState<Record<string, string>>({});
  const [netTakeHome, setNetTakeHome] = useState<number>(0);
  const [totalTaxLiability, setTotalTaxLiability] = useState<number>(0);
  const [effectiveTaxRate, setEffectiveTaxRate] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<
    | { label: string; value: number; color: string }[]
    | undefined
  >(undefined);
  const [copied, setCopied] = useState(false);

  // Initialize state from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const val1Param = params.get('v1');
    const val2Param = params.get('v2');
    const modeParam = params.get('mode');
    const freqParam = params.get('freq');

    if (val1Param !== null) {
      const parsedVal1 = parseFloat(val1Param);
      if (!isNaN(parsedVal1)) setVal1(parsedVal1);
    }

    if (val2Param !== null) {
      const parsedVal2 = parseFloat(val2Param);
      if (!isNaN(parsedVal2)) setVal2(parsedVal2);
    }

    if (modeParam !== null) {
      setModeState(modeParam);
    }

    if (freqParam && ['annual', 'monthly', 'weekly'].includes(freqParam)) {
      setFreq(freqParam as 'annual' | 'monthly' | 'weekly');
    }

    // Calculate result when URL params change
    calculateResult();
  }, [slug]);

  // Update URL when state changes
  const updateURL = () => {
    const params = new URLSearchParams();
    params.set('v1', val1.toString());
    params.set('v2', val2.toString());
    params.set('mode', modeState);
    params.set('freq', freq);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Calculate result based on slug
  const calculateResult = () => {
    // Initialize all variables to safe defaults
    let net = 0;
    let totalTax = 0;
    let effectiveRate = 0;
    let dedExp = 0;
    let taxAmt = 0;
    // Variables used in calculations object
    let grossRevenue = 0;
    let businessExpenses = 0;
    let businessStructure = '';
    let netProfit = 0;
    let SECA_RATE = 0;
    let STANDARD_DEDUCTION = 0;
    let secaTax = 0;
    let federalTax = 0;
    let actualSecaTax = 0;
    let dayRate = 0;
    let workingDays = 0;
    let ir35Status = '';
    let grossIncome = 0;
    let workRelatedExpenses = 0;
    let superannuationRate = 0;
    let medicareLevyRate = 0;
    let medicareLevy = 0;
    let superannuation = 0;
    let incomeTax = 0;
    let taxableIncome = 0;
    let nic = 0;
    let class2 = 0;
    let class4 = 0;
    let estimatedAnnualTax = 0;
    let withholding = 0;
    let netTaxOwed = 0;
    let quarterlyPayment = 0;

    if (slug === 'us-1099-freelance-tax-calculator') {
      grossRevenue = val1;
      businessExpenses = val2;
      businessStructure = modeState;

      netProfit = grossRevenue - businessExpenses;
      SECA_RATE = 0.153; // From constants in tools.json
      STANDARD_DEDUCTION = 16100; // From constants in tools.json

      secaTax = netProfit * SECA_RATE;
      taxableIncome = Math.max(0, netProfit - STANDARD_DEDUCTION);
      federalTax = 0;

      // 2026 tax brackets for single filer (estimated)
      if (taxableIncome <= 11600) {
        federalTax = taxableIncome * 0.1;
      } else if (taxableIncome <= 47300) {
        federalTax = 11600 * 0.1 + (taxableIncome - 11600) * 0.12;
      } else if (taxableIncome <= 95375) {
        federalTax = 11600 * 0.1 + (47300 - 11600) * 0.12 + (taxableIncome - 47300) * 0.22;
      } else if (taxableIncome <= 182100) {
        federalTax =
          11600 * 0.1 +
          (47300 - 11600) * 0.12 +
          (95375 - 47300) * 0.22 +
          (taxableIncome - 95375) * 0.24;
      } else if (taxableIncome <= 231250) {
        federalTax =
          11600 * 0.1 +
          (47300 - 11600) * 0.12 +
          (95375 - 47300) * 0.22 +
          (182100 - 95375) * 0.24 +
          (taxableIncome - 182100) * 0.32;
      } else if (taxableIncome <= 578125) {
        federalTax =
          11600 * 0.1 +
          (47300 - 11600) * 0.12 +
          (95375 - 47300) * 0.22 +
          (182100 - 95375) * 0.24 +
          (231250 - 182100) * 0.32 +
          (taxableIncome - 231250) * 0.35;
      } else {
        federalTax =
          11600 * 0.1 +
          (47300 - 11600) * 0.12 +
          (95375 - 47300) * 0.22 +
          (182100 - 95375) * 0.24 +
          (231250 - 182100) * 0.32 +
          (578125 - 231250) * 0.35 +
          (taxableIncome - 578125) * 0.37;
      }

      // For S-Corp, we assume that the reasonable salary is netProfit * 0.5 (simplified)
      actualSecaTax = secaTax;
      if (businessStructure === 'S-Corp') {
        const reasonableSalary = netProfit * 0.5;
        actualSecaTax = reasonableSalary * SECA_RATE;
        // The distribution (netProfit - reasonableSalary) is not subject to SECA tax
      }

      totalTax = actualSecaTax + federalTax;
      net = grossRevenue - businessExpenses - totalTax;
      effectiveRate = net > 0 ? (totalTax / (grossRevenue - businessExpenses)) * 100 : 0;

      dedExp = businessExpenses;
      taxAmt = totalTax;
    } else if (slug === 'uk-contractor-ir35-calculator') {
      dayRate = val1;
      workingDays = val2;
      ir35Status = modeState;

      grossIncome = dayRate * workingDays;

      // Tax and NICs calculation for 2023/24 (UK)
      const personalAllowance = 12570;
      incomeTax = 0;
      taxableIncome = Math.max(0, grossIncome - personalAllowance);
      if (taxableIncome <= 37700) {
        incomeTax = taxableIncome * 0.2;
      } else if (taxableIncome <= 125140) {
        incomeTax = 37700 * 0.2 + (taxableIncome - 37700) * 0.4;
      } else {
        incomeTax =
          37700 * 0.2 +
          (125140 - 37700) * 0.4 +
          (taxableIncome - 125140) * 0.45;
      }

      nic = 0;
      if (ir35Status === 'Inside IR35') {
        // Class 1 NICs (employed)
        if (grossIncome <= 12570) {
          nic = 0;
        } else if (grossIncome <= 50270) {
          nic = (grossIncome - 12570) * 0.12;
        } else {
          nic = (50270 - 12570) * 0.12 + (grossIncome - 50270) * 0.02;
        }
      } else {
        // Class 2 and Class 4 NICs (self-employed)
        class2 = grossIncome > 12570 ? 179.40 : 0; // £3.45 * 52 weeks
        class4 = 0;
        if (grossIncome > 12570) {
          if (grossIncome <= 50270) {
            class4 = (grossIncome - 12570) * 0.09;
          } else {
            class4 = (grossIncome - 12570) * 0.09 + (grossIncome - 50270) * 0.02;
          }
        }
        nic = class2 + class4;
      }

      totalTax = incomeTax + nic;
      net = grossIncome - totalTax;
      effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

      dedExp = 0; // No expenses in this model
      taxAmt = totalTax;
    } else if (slug === 'au-contractor-sole-trader-tax-calculator') {
      grossIncome = val1;
      workRelatedExpenses = val2;

      taxableIncome = Math.max(0, grossIncome - workRelatedExpenses);
      superannuationRate = 0.115; // From constants in tools.json
      medicareLevyRate = 0.02; // From constants in tools.json

      // Calculate superannuation (concessional contribution)
      superannuation = grossIncome * superannuationRate;

      // Calculate income tax (2024-25 rates for resident)
      incomeTax = 0;
      if (taxableIncome <= 18200) {
        incomeTax = 0;
      } else if (taxableIncome <= 45000) {
        incomeTax = (taxableIncome - 18200) * 0.16;
      } else if (taxableIncome <= 135000) {
        incomeTax = 4288 + (taxableIncome - 45000) * 0.30;
      } else if (taxableIncome <= 190000) {
        incomeTax = 31288 + (taxableIncome - 135000) * 0.37;
      } else {
        incomeTax = 51638 + (taxableIncome - 190000) * 0.45;
      }

      // Calculate Medicare levy (2% of taxable income)
      medicareLevy = taxableIncome * medicareLevyRate;

      // Total tax and levies
      totalTax = incomeTax + medicareLevy;

      // Net take-home (gross income minus expenses, tax, levies, plus superannuation)
      // Note: Superannuation is deducted from take-home pay but shown as a benefit
      net = grossIncome - workRelatedExpenses - totalTax - superannuation;
      effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

      dedExp = workRelatedExpenses;
      taxAmt = totalTax;
    } else if (slug === 'us-quarterly-estimated-tax-calculator') {
      estimatedAnnualTax = val1;
      withholding = val2;

      netTaxOwed = Math.max(0, estimatedAnnualTax - withholding);
      quarterlyPayment = netTaxOwed / 4;

      // For this calculator, we show the quarterly payment as the main KPI
      net = quarterlyPayment; // This will be displayed as the "Net Take-Home" equivalent
      totalTax = netTaxOwed; // Total tax liability
      effectiveRate = estimatedAnnualTax > 0 ? (netTaxOwed / estimatedAnnualTax) * 100 : 0;

      dedExp = withholding; // Treat withholding as deductions
      taxAmt = netTaxOwed;
    }

    // Apply frequency scaling for display purposes
    const frequencyDivisor = () => {
      switch (freq) {
        case 'annual': return 1;
        case 'monthly': return 12;
        case 'weekly': return 52;
        case 'fortnightly': return 26;
        default: return 1;
      }
    };

    const scaledNet = net / frequencyDivisor();
    const scaledTax = totalTax / frequencyDivisor();

    setNetTakeHome(scaledNet);
    setTotalTaxLiability(scaledTax);
    setEffectiveTaxRate(effectiveRate);

    // Set breakdown for visual bar
    let breakdownData: { label: string; value: number; color: string }[] = [];

    if (slug === 'us-1099-freelance-tax-calculator') {
      // US Layout: SECA Tax, Single Standard Deduction, Federal Income Tax
      breakdownData = [
        { label: 'SECA Tax (15.3%)', value: secaTax, color: '#F59E0B' }, // Amber
        { label: 'Single Standard Deduction ($16,100)', value: Math.min(netProfit, STANDARD_DEDUCTION), color: '#4F46E5' }, // Indigo
        { label: 'Federal Income Tax', value: federalTax, color: '#10B981' } // Emerald
      ];
    } else if (slug === 'uk-contractor-ir35-calculator') {
      // UK Layout: Director Salary, Corporation Tax, Available Dividends, Personal Dividend Tax
      // Simplified representation for visualization
      const directorSalary = Math.min(grossIncome, 12570);
      const availableDividends = Math.max(0, grossIncome - directorSalary - totalTax);
      breakdownData = [
        { label: 'Director Salary (£12,570)', value: directorSalary, color: '#10B981' }, // Emerald
        { label: 'Corporation Tax', value: totalTax * 0.7, color: '#F59E0B' }, // Amber (approx)
        { label: 'Available Dividends', value: availableDividends * 0.8, color: '#4F46E5' }, // Indigo (approx)
        { label: 'Personal Dividend Tax', value: availableDividends * 0.2, color: '#DC2626' } // Red
      ];
    } else if (slug === 'au-contractor-sole-trader-tax-calculator') {
      // Australia Layout: Resident Income Tax (ATO), Medicare Levy (2%), Compulsory Super Guarantee (12%)
      breakdownData = [
        { label: 'Resident Income Tax (ATO)', value: incomeTax, color: '#F59E0B' }, // Amber
        { label: 'Medicare Levy (2%)', value: medicareLevy, color: '#DC2626' }, // Red
        { label: 'Compulsory Super Guarantee (12%)', value: superannuation, color: '#10B981' }, // Emerald
        { label: 'Net Take-Home', value: net, color: '#4F46E5' } // Indigo
      ];
    } else if (slug === 'us-quarterly-estimated-tax-calculator') {
      // For quarterly tax calculator, show: Withholding (deductions), Tax Owed, Net (for simplicity)
      breakdownData = [
        { label: 'Withholding', value: dedExp, color: '#4F46E5' }, // Indigo
        { label: 'Tax Owed', value: taxAmt, color: '#F59E0B' }, // Amber
        { label: 'Net', value: net, color: '#10B981' } // Emerald
      ];
    } else {
      // Fallback
      breakdownData = [
        { label: 'Deductions/Expenses', value: dedExp, color: '#4F46E5' }, // Indigo
        { label: 'Estimated Taxes', value: taxAmt, color: '#F59E0B' }, // Amber
        { label: 'Net Take-Home', value: net, color: '#10B981' } // Emerald
      ];
    }
    setBreakdown(breakdownData);

    // Set calculations for detailed table
    const calculationsObj: Record<string, string> = {};
    if (slug === 'us-1099-freelance-tax-calculator') {
      calculationsObj['Gross Revenue'] = `$${grossRevenue.toLocaleString()}`;
      calculationsObj['Business Expenses'] = `$${businessExpenses.toLocaleString()}`;
      calculationsObj['Net Profit'] = `$${netProfit.toLocaleString()}`;
      calculationsObj['SECA Tax'] = `$${actualSecaTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      calculationsObj['Federal Tax'] = `$${federalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      calculationsObj['Total Tax Liability'] = `$${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      calculationsObj['Net Take-Home'] = `$${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      calculationsObj['Effective Tax Rate'] = `${effectiveRate.toFixed(2)}%`;
    } else if (slug === 'uk-contractor-ir35-calculator') {
      calculationsObj['Gross Income'] = `£${grossIncome.toLocaleString()}`;
      calculationsObj['Income Tax'] = `£${incomeTax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['NICs'] = `£${nic.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Total Tax & NICs'] = `£${totalTax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Net Take-Home'] = `£${net.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Effective Tax Rate'] = `${effectiveRate.toFixed(2)}%`;
    } else if (slug === 'au-contractor-sole-trader-tax-calculator') {
      calculationsObj['Gross Income'] = `A$${grossIncome.toLocaleString()}`;
      calculationsObj['Work-Related Expenses'] = `A$${workRelatedExpenses.toLocaleString()}`;
      calculationsObj['Taxable Income'] = `A$${(grossIncome - workRelatedExpenses).toLocaleString()}`;
      calculationsObj['Income Tax'] = `A$${incomeTax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Medicare Levy'] = `A$${medicareLevy.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Superannuation'] = `A$${superannuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Total Tax & Levies'] = `A$${totalTax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Net Take-Home'] = `A$${net.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      calculationsObj['Effective Tax Rate'] = `${effectiveRate.toFixed(2)}%`;
    } else if (slug === 'us-quarterly-estimated-tax-calculator') {
      calculationsObj['Estimated Annual Tax'] = `$${estimatedAnnualTax.toLocaleString()}`;
      calculationsObj['Tax Withholding'] = `$${withholding.toLocaleString()}`;
      calculationsObj['Net Tax Owed'] = `$${netTaxOwed.toLocaleString()}`;
      calculationsObj['Quarterly Payment'] = `$${quarterlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      calculationsObj['Effective Tax Rate'] = `${effectiveRate.toFixed(2)}%`;
    }
    setCalculations(calculationsObj);
  };

  // Recalculate when inputs change
  useEffect(() => {
    calculateResult();
    updateURL();
  }, [val1, val2, modeState, freq]);

  // Copy current URL to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Frequency divisor for converting annual values to pay period values
  const frequencyDivisor = () => {
    switch (freq) {
      case 'annual': return 1;
      case 'monthly': return 12;
      case 'weekly': return 52;
      case 'fortnightly': return 26;
      default: return 1;
    }
  };

  return (
    <section className="space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {currency === '$' ? 'US' : currency === '£' ? 'UK' : 'Australia'} • {optimizationRule ? 'See optimization tip below' : ''}
        </p>
      </div>

      {/* Pay Frequency Toggle */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">Pay Frequency:</span>
          <div className="inline-flex items-center space-x-1 rounded-md shadow-sm">
            {slug === 'au-contractor-sole-trader-tax-calculator' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('annual');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'annual' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Annual ]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('monthly');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'monthly' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Monthly ]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('weekly');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'weekly' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Weekly ]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('fortnightly');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'fortnightly' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Fortnightly ]
                </button>
              </>
            )}
            {slug !== 'au-contractor-sole-trader-tax-calculator' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('annual');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'annual' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Annual ]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('monthly');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'monthly' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Monthly ]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFreq('weekly');
                    updateURL();
                    calculateResult();
                  }}
                  className={`px-3 py-2 text-sm font-medium ${freq === 'weekly' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  [ Weekly ]
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quarterly Tax Schedule (US only - for us-quarterly-estimated-tax-calculator) */}
      {slug === 'us-quarterly-estimated-tax-calculator' && totalTaxLiability > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Estimated Tax Schedule (IRS 1040-ES)</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="shrink-0 flex-shrink-0 h-8 w-8 rounded bg-indigo-100 p-1">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Quarterly Payment Due Dates</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Based on your annual tax liability of <span className="font-medium">${currency === '$' ? `$${(totalTaxLiability * frequencyDivisor()).toLocaleString()}` : `£${(totalTaxLiability * frequencyDivisor()).toLocaleString()}`}</span>,
                  your quarterly estimated tax payments are:
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">Q1 Payment</p>
                <p className="text-lg font-bold text-gray-900">${currency === '$' ? `$${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `£${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
                <p className="text-xs text-gray-500">Due April 15</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">Q2 Payment</p>
                <p className="text-lg font-bold text-gray-900">${currency === '$' ? `$${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `£${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
                <p className="text-xs text-gray-500">Due June 16</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">Q3 Payment</p>
                <p className="text-lg font-bold text-gray-900">${currency === '$' ? `$${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `£${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
                <p className="text-xs text-gray-500">Due September 15</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">Q4 Payment</p>
                <p className="text-lg font-bold text-gray-900">${currency === '$' ? `$${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `£${((totalTaxLiability * frequencyDivisor()) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
                <p className="text-xs text-gray-500">Due January 15*</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              *If the due date falls on a weekend or holiday, the payment is due the next business day.
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Card */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-sm text-gray-500">Net Take-Home</p>
            <p className="text-2xl font-bold text-gray-900">
              {currency === '$' ? `$${netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `£${netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Tax Liability</p>
            <p className="text-2xl font-bold text-gray-900">
              {currency === '$' ? `$${totalTaxLiability.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `£${totalTaxLiability.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Effective Tax Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {effectiveTaxRate.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle (if applicable) */}
      {(slug === 'us-1099-freelance-tax-calculator' || slug === 'uk-contractor-ir35-calculator') && (
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600">
              {slug === 'us-1099-freelance-tax-calculator' ? 'Business Structure' : 'IR35 Status'}
            </span>
            <div className="inline-flex items-center space-x-1 rounded-md shadow-sm">
              {slug === 'us-1099-freelance-tax-calculator' ? (
                <>
                  <button
                    type="button"
                    value="1099 Sole Prop"
                    onChange={(e) => {
                      setModeState(e.target.value);
                      updateURL();
                      calculateResult();
                    }}
                    className={`px-3 py-2 text-sm font-medium ${modeState === '1099 Sole Prop' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    1099 Sole Prop
                  </button>
                  <button
                    type="button"
                    value="S-Corp"
                    onChange={(e) => {
                      setModeState(e.target.value);
                      updateURL();
                      calculateResult();
                    }}
                    className={`px-3 py-2 text-sm font-medium ${modeState === 'S-Corp' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    S-Corp
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    value="Outside IR35"
                    onChange={(e) => {
                      setModeState(e.target.value);
                      updateURL();
                      calculateResult();
                    }}
                    className={`px-3 py-2 text-sm font-medium ${modeState === 'Outside IR35' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    Outside IR35
                  </button>
                  <button
                    type="button"
                    value="Inside IR35"
                    onChange={(e) => {
                      setModeState(e.target.value);
                      updateURL();
                      calculateResult();
                    }}
                    className={`px-3 py-2 text-sm font-medium ${modeState === 'Inside IR35' ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    Inside IR35
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <form className="grid gap-4 sm:grid-cols-2">
        {slug === 'us-1099-freelance-tax-calculator' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Gross 1099 Income ($)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={val1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal1(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schedule C Deductions ($)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={val2}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal2(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
          </>
        )}
        {slug === 'uk-contractor-ir35-calculator' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Daily Rate (£)</label>
              <input
                type="number"
                min={0}
                step={10}
                value={val1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal1(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Days Worked / Year</label>
              <input
                type="number"
                min={0}
                max={365}
                step={1}
                value={val1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal1(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Allowable Business Expenses (£)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={val2}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal2(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
          </>
        )}
        {slug === 'au-contractor-sole-trader-tax-calculator' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Gross Invoiced Income ($)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={val1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal1(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work-Related Expenses ($)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={val2}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal2(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
          </>
        )}
        {slug === 'us-quarterly-estimated-tax-calculator' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Annual Tax ($)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={val1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal1(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Withholding ($)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={val2}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setVal2(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
          </>
        )}
      </form>

      {/* Visual Distribution Bar */}
      {breakdown && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Income Breakdown</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            {breakdown.map((segment, index) => (
              <div
                key={index}
                className={`h-4 rounded-full ${index === 0 ? 'rounded-l-full' : index === breakdown.length - 1 ? 'rounded-r-full' : ''} bg-${segment.color}-500`}
                style={{ width: `${(segment.value / (breakdown.reduce((sum, b) => sum + b.value, 0) * 100))}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            {breakdown.map(segment => (
              <span key={segment.label}>
                {segment.label}: {(currency === '$' || currency === 'A$') ? `$${segment.value.toLocaleString()}` : `£${segment.value.toLocaleString()}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Callout */}
      {optimizationRule && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
          <div className="flex">
            <div className="shrink-0">
              <div className="flex-shrink-0 h-10 w-10 rounded bg-blue-100 p-1">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 14l3 3m0 0l-3 3M3 10h18a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2zm0-4a2 2 0 100 4 2 2 0 000-4zm-1 9h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Optimization Tip</h3>
              <p className="mt-1 text-sm text-blue-600">{optimizationRule}</p>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Card Grid - removed as per new tools.json structure */}
      {/* Detailed Calculations */}
      {Object.keys(calculations).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculation Details</h2>
          <div className="space-y-2">
            {Object.entries(calculations).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm text-gray-600">
                <span className="font-medium">{label}:</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static Fallback Table for SEO */}
      {staticBreakdown && staticBreakdown.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Calculations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {staticBreakdown.length > 0 &&
                    Object.keys(staticBreakdown[0])
                      .filter(key => !['result'].includes(key)) // Exclude 'result' from columns
                      .map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staticBreakdown.map((row, index) => (
                  <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                    {Object.keys(row)
                      .filter(key => !['result'].includes(key))
                      .map((key) => (
                        <td
                          key={key}
                          className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                        >
                          {row[key as keyof typeof row]}
                        </td>
                      ))}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                      {row.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-gray-500 text-center">
              *Sample calculations for demonstration purposes. Actual results vary based on inputs.
            </p>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {faqItems && faqItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">{faq.question}</h3>
                <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}