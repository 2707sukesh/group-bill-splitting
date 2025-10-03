import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, CssBaseline, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Chip, Stack, Divider, TextField, Button } from '@mui/material';

type ReceiptItem = { description: string; quantity: number; unitPrice: number; totalPrice: number };

type ReceiptRecord = {
  id: string;
  items: ReceiptItem[];
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
};

const DEFAULT_PEOPLE = ["Sukesh", "Daivik", "KD", "Thilak", "Srikant", "Nithin"];

export default function BillView() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ReceiptRecord | null>(null);
  const [people, setPeople] = useState<string[]>(DEFAULT_PEOPLE);
  const [newPerson, setNewPerson] = useState('');
  const [selections, setSelections] = useState<Record<number, Record<number, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`http://localhost:8080/api/receipts/${id}`);
        if (!res.ok) throw new Error(`Not found`);
        const data = await res.json();
        if (active) {
          setRecord(data);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
    return () => { active = false; };
  }, [id]);

  const toggleSelection = (itemIndex: number, personIndex: number) => {
    setSelections((prev) => {
      const row = prev[itemIndex] ? { ...prev[itemIndex] } : {};
      row[personIndex] = !row[personIndex];
      return { ...prev, [itemIndex]: row };
    });
  };

  const addPerson = () => {
    const name = newPerson.trim();
    if (!name) return;
    setPeople((prev) => [...prev, name]);
    setNewPerson('');
  };

  const removePerson = (index: number) => {
    setPeople((prev) => prev.filter((_, i) => i !== index));
    setSelections((prev) => {
      const copy: Record<number, Record<number, boolean>> = {};
      Object.entries(prev).forEach(([itemIdx, map]) => {
        const newMap: Record<number, boolean> = {};
        Object.entries(map).forEach(([pIdx, val]) => {
          const p = Number(pIdx);
          if (p < index) newMap[p] = val as boolean;
          if (p > index) newMap[p - 1] = val as boolean;
        });
        copy[Number(itemIdx)] = newMap;
      });
      return copy;
    });
  };

  const perPersonTotals = useMemo(() => {
    const items = record?.items ?? [];
    if (people.length === 0 || items.length === 0) {
      return { subtotals: Array(people.length).fill(0) as number[], totals: Array(people.length).fill(0) as number[] };
    }
    const subtotals = Array(people.length).fill(0) as number[];
    items.forEach((it, idx) => {
      const row = selections[idx] || {};
      const selectedIndices = Object.keys(row)
        .map((k) => Number(k))
        .filter((i) => !!row[i]);
      const selectedCount = selectedIndices.length;
      const share = selectedCount > 0 ? it.totalPrice / selectedCount : 0;
      selectedIndices.forEach((i) => {
        subtotals[i] += share;
      });
    });
    // Ignoring tax entirely: totals equal item subtotals
    const totals = subtotals.map((s) => s);
    return { subtotals, totals };
  }, [people.length, selections, record?.items]);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom>
            Bill View {record?.id ? `#${record.id}` : ''}
          </Typography>

          {loading && <Typography>Loading…</Typography>}
          {error && <Typography color="error">{error}</Typography>}

          {record && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField size="small" label="Add person" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addPerson(); }} />
                <Button variant="outlined" onClick={addPerson}>Add</Button>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {people.map((p, idx) => (
                    <Chip key={idx} label={p} onDelete={() => removePerson(idx)} />
                  ))}
                </Stack>
              </Stack>

              <Paper>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit</TableCell>
                        <TableCell align="right">Total</TableCell>
                        {people.map((p, idx) => (
                          <TableCell key={idx} align="center">{p}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {record.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{it.description}</TableCell>
                          <TableCell align="right">{it.quantity}</TableCell>
                          <TableCell align="right">${it.unitPrice.toFixed(2)}</TableCell>
                          <TableCell align="right">${it.totalPrice.toFixed(2)}</TableCell>
                          {people.map((_p, pIdx) => (
                            <TableCell key={pIdx} align="center">
                              <Checkbox size="small" checked={!!(selections[idx]?.[pIdx])} onChange={() => toggleSelection(idx, pIdx)} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">Subtotal from receipt: {record.subtotal != null ? `$${record.subtotal.toFixed(2)}` : 'N/A'} | Tax: {record.tax != null ? `$${record.tax.toFixed(2)}` : 'N/A'} | Total: {record.total != null ? `$${record.total.toFixed(2)}` : 'N/A'}</Typography>
              </Box>

              {people.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Per-person totals</Typography>
                  <Paper>
                    <TableContainer sx={{ maxHeight: 360 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Person</TableCell>
                            <TableCell align="right">Items Share</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {people.map((p, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{p}</TableCell>
                              <TableCell align="right">${perPersonTotals.subtotals[idx].toFixed(2)}</TableCell>
                              <TableCell align="right">${perPersonTotals.totals[idx].toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </>
              )}
            </>
          )}
        </Box>
      </Container>
    </>
  );
}
