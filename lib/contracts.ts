export const CONTRACT_STATUS_OPTIONS = [
  'Inscrito',
  'Pendiente de enviar a notaría',
  'Pendiente de firma de René en notaría',
  'Listo para retiro del cliente',
  'Contrato entregado'
] as const;

export type ContractStatus = (typeof CONTRACT_STATUS_OPTIONS)[number];

export const CONTRACT_STATUS_TYPE_CODE = 'estado_contractual';
export const FILTER_WITH_CONTRACT = '__with_contract__';

const CONTRACT_STATUS_SET = new Set<string>(CONTRACT_STATUS_OPTIONS);

export function isContractStatus(value: string | null | undefined): value is ContractStatus {
  return !!value && CONTRACT_STATUS_SET.has(value);
}

export function hasContract(status: string | null | undefined) {
  return !!status && status !== 'Inscrito';
}

type EstadoTipoLike = { id: string; codigo: string };
type EstadoValorLike = {
  ficha_id: string;
  estado_tipo_id: string;
  valor_bool?: boolean | null;
  valor_texto?: string | null;
};

export function buildContractStatusMap(
  fichas: Array<{ id: string; perfil_id: string }>,
  estadoTipos: EstadoTipoLike[],
  estadoValores: EstadoValorLike[]
) {
  const codeById = new Map(estadoTipos.map((item) => [item.id, item.codigo]));
  const valuesByFichaCode = new Map<string, Record<string, EstadoValorLike>>();

  estadoValores.forEach((value) => {
    const codigo = codeById.get(value.estado_tipo_id);
    if (!codigo) return;
    const current = valuesByFichaCode.get(value.ficha_id) ?? {};
    current[codigo] = value;
    valuesByFichaCode.set(value.ficha_id, current);
  });

  const contractByProfileId = new Map<string, ContractStatus | null>();

  fichas.forEach((ficha) => {
    const values = valuesByFichaCode.get(ficha.id) ?? {};
    const explicit = values[CONTRACT_STATUS_TYPE_CODE]?.valor_texto ?? null;

    if (isContractStatus(explicit)) {
      contractByProfileId.set(ficha.perfil_id, explicit);
      return;
    }

    if (values.firmado_retiro?.valor_bool) {
      contractByProfileId.set(ficha.perfil_id, 'Listo para retiro del cliente');
      return;
    }

    if (values.contrato_notaria?.valor_bool) {
      contractByProfileId.set(ficha.perfil_id, 'Pendiente de firma de René en notaría');
      return;
    }

    if (values.inscripcion?.valor_bool) {
      contractByProfileId.set(ficha.perfil_id, 'Inscrito');
      return;
    }

    contractByProfileId.set(ficha.perfil_id, null);
  });

  return contractByProfileId;
}

export function matchesContractFilter(filter: string | undefined, status: string | null | undefined) {
  if (!filter) return true;
  if (filter === FILTER_WITH_CONTRACT) return hasContract(status);
  return status === filter;
}
