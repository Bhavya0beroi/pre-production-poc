-- Fix existing shoots that have PDFs uploaded but wrong status
-- This updates shoots that have invoice_file but are not in pending_invoice or completed status

-- First, let's see which shoots need fixing
SELECT id, name, status, 
       CASE WHEN invoice_file IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as pdf_status,
       paid
FROM shoots 
WHERE invoice_file IS NOT NULL 
  AND status NOT IN ('pending_invoice', 'completed')
ORDER BY name;

-- Update those shoots to pending_invoice status
-- (They should appear in Finance & Invoices after this)
UPDATE shoots 
SET status = 'pending_invoice'
WHERE invoice_file IS NOT NULL 
  AND status NOT IN ('pending_invoice', 'completed')
  AND paid = FALSE;

-- For shoots that are already paid, set status to completed
UPDATE shoots 
SET status = 'completed'
WHERE invoice_file IS NOT NULL 
  AND paid = TRUE
  AND status != 'completed';

-- Verify the changes
SELECT id, name, status, paid,
       CASE WHEN invoice_file IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as pdf_status
FROM shoots 
WHERE invoice_file IS NOT NULL
ORDER BY name;
