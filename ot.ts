import { OTOperation } from '../types';

/**
 * Operational Transformation utilities
 * Implements basic OT for text editing with insert, delete, and retain operations
 */

export function applyOperation(content: string, operation: OTOperation): string {
  switch (operation.type) {
    case 'insert':
      return (
        content.slice(0, operation.position) +
        (operation.content || '') +
        content.slice(operation.position)
      );
    
    case 'delete':
      return (
        content.slice(0, operation.position) +
        content.slice(operation.position + (operation.length || 0))
      );
    
    case 'retain':
      return content; // No change needed for retain
    
    default:
      return content;
  }
}

/**
 * Transform operation A against operation B
 * Returns a new operation A' that can be applied after B
 */
export function transformOperation(opA: OTOperation, opB: OTOperation): OTOperation {
  // If operations don't overlap, return original
  if (!operationsOverlap(opA, opB)) {
    return adjustOperationPosition(opA, opB);
  }

  // Handle specific combinations
  if (opA.type === 'insert' && opB.type === 'insert') {
    return transformInsertInsert(opA, opB);
  }

  if (opA.type === 'insert' && opB.type === 'delete') {
    return transformInsertDelete(opA, opB);
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    return transformDeleteInsert(opA, opB);
  }

  if (opA.type === 'delete' && opB.type === 'delete') {
    return transformDeleteDelete(opA, opB);
  }

  return opA;
}

function operationsOverlap(opA: OTOperation, opB: OTOperation): boolean {
  const aEnd = opA.position + (opA.length || (opA.content?.length || 0));
  const bEnd = opB.position + (opB.length || (opB.content?.length || 0));

  return !(aEnd <= opB.position || bEnd <= opA.position);
}

function adjustOperationPosition(opA: OTOperation, opB: OTOperation): OTOperation {
  const newOp = { ...opA };

  if (opB.type === 'insert' && opB.position <= opA.position) {
    newOp.position += opB.content?.length || 0;
  } else if (opB.type === 'delete' && opB.position < opA.position) {
    newOp.position -= Math.min(
      opB.length || 0,
      opA.position - opB.position
    );
  }

  return newOp;
}

function transformInsertInsert(opA: OTOperation, opB: OTOperation): OTOperation {
  const newOp = { ...opA };

  if (opB.position < opA.position) {
    newOp.position += opB.content?.length || 0;
  } else if (opB.position === opA.position) {
    // Tie-breaking: user with lower ID wins
    newOp.position += opB.content?.length || 0;
  }

  return newOp;
}

function transformInsertDelete(opA: OTOperation, opB: OTOperation): OTOperation {
  const newOp = { ...opA };
  const deleteEnd = opB.position + (opB.length || 0);

  if (opA.position < opB.position) {
    // Insert before delete range
    return newOp;
  } else if (opA.position >= deleteEnd) {
    // Insert after delete range
    newOp.position -= opB.length || 0;
  } else {
    // Insert within delete range
    newOp.position = opB.position;
  }

  return newOp;
}

function transformDeleteInsert(opA: OTOperation, opB: OTOperation): OTOperation {
  const newOp = { ...opA };

  if (opB.position <= opA.position) {
    newOp.position += opB.content?.length || 0;
  } else if (opB.position < opA.position + (opA.length || 0)) {
    // Insert within delete range - split the delete
    newOp.length = (newOp.length || 0) + (opB.content?.length || 0);
  }

  return newOp;
}

function transformDeleteDelete(opA: OTOperation, opB: OTOperation): OTOperation {
  const newOp = { ...opA };
  const aEnd = opA.position + (opA.length || 0);
  const bEnd = opB.position + (opB.length || 0);

  if (bEnd <= opA.position) {
    // B deletes before A
    newOp.position -= opB.length || 0;
  } else if (opB.position >= aEnd) {
    // B deletes after A
    return newOp;
  } else {
    // Overlapping deletes
    const overlapStart = Math.max(opA.position, opB.position);
    const overlapEnd = Math.min(aEnd, bEnd);
    const overlapLength = overlapEnd - overlapStart;

    if (opB.position <= opA.position) {
      newOp.position = opB.position;
      newOp.length = (newOp.length || 0) - overlapLength;
    } else {
      newOp.length = (newOp.length || 0) - overlapLength;
    }

    // Ensure length is not negative
    newOp.length = Math.max(0, newOp.length || 0);
  }

  return newOp;
}

/**
 * Create an insert operation
 */
export function createInsertOp(position: number, content: string): OTOperation {
  return {
    type: 'insert',
    position,
    content,
  };
}

/**
 * Create a delete operation
 */
export function createDeleteOp(position: number, length: number): OTOperation {
  return {
    type: 'delete',
    position,
    length,
  };
}

/**
 * Create a retain operation
 */
export function createRetainOp(position: number): OTOperation {
  return {
    type: 'retain',
    position,
  };
}

/**
 * Compose two operations into a single operation
 */
export function composeOperations(op1: OTOperation, op2: OTOperation): OTOperation {
  // Apply op1 first, then apply op2 to the result
  // This is a simplified composition - full implementation would be more complex
  
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.position + (op1.content?.length || 0) === op2.position) {
      return {
        type: 'insert',
        position: op1.position,
        content: (op1.content || '') + (op2.content || ''),
      };
    }
  }

  if (op1.type === 'delete' && op2.type === 'delete') {
    if (op1.position === op2.position) {
      return {
        type: 'delete',
        position: op1.position,
        length: (op1.length || 0) + (op2.length || 0),
      };
    }
  }

  // Can't compose - return second operation
  return op2;
}

/**
 * Invert an operation (for undo functionality)
 */
export function invertOperation(operation: OTOperation, content: string): OTOperation {
  switch (operation.type) {
    case 'insert':
      return createDeleteOp(operation.position, operation.content?.length || 0);
    
    case 'delete':
      const deletedContent = content.slice(
        operation.position,
        operation.position + (operation.length || 0)
      );
      return createInsertOp(operation.position, deletedContent);
    
    case 'retain':
      return operation;
    
    default:
      return operation;
  }
}