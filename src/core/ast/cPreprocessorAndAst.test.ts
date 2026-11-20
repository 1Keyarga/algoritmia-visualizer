import { describe, expect, it } from 'vitest';
import { instrumentAndTraceStudentCode } from './astInstrumenter';

describe('Preprocesador C/C++ y Motor AST Mejorado', () => {
  it('soporta prototipos arriba de main, función swap con punteros (*a, *b) de cualquier nombre y aritmética *(arr + i)', () => {
    const code = `#include <stdio.h>

void miIntercambioPunteros(int *x, int *y);
void ordenarConPunteros(
    int arr[],
    int n
);

void miIntercambioPunteros(int *x, int *y) {
    int aux = *x;
    *x = *y;
    *y = aux;
}

void ordenarConPunteros(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (*(arr + j) > *(arr + j + 1)) {
                miIntercambioPunteros(&arr[j], &arr[j + 1]);
            }
        }
    }
}

int main() {
    int datos[] = { 9, 3, 7, 1 };
    int n = sizeof(datos) / sizeof(datos[0]);
    ordenarConPunteros(datos, n);
    return 0;
}`;

    const res = instrumentAndTraceStudentCode(code, [9, 3, 7, 1]);
    expect(res.success, res.error).toBe(true);
    const finalArr = res.steps?.at(-1)?.array.map(e => e.value);
    expect(finalArr).toEqual([1, 3, 7, 9]);
    expect((res.steps?.at(-1)?.metrics.swaps ?? 0)).toBeGreaterThan(0);
  });

  it('soporta malloc, calloc, free, new int[n] y delete[] en Merge Sort con múltiples funciones', () => {
    const code = `#include <stdio.h>
#include <stdlib.h>

void fusionar(int arr[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int *L = (int*)malloc(n1 * sizeof(int));
    int *R = new int[n2];

    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) { arr[k] = L[i]; i++; k++; }
    while (j < n2) { arr[k] = R[j]; j++; k++; }

    free(L);
    delete[] R;
}

void miMergeSort(int arr[], int l, int r) {
    if (l >= r) return;
    int m = (int)((l + r) / 2);
    miMergeSort(arr, l, m);
    miMergeSort(arr, m + 1, r);
    fusionar(arr, l, m, r);
}

int main() {
    int arr[] = { 12, 4, 9, 2, 7 };
    miMergeSort(arr, 0, 4);
    return 0;
}`;

    const res = instrumentAndTraceStudentCode(code, [12, 4, 9, 2, 7]);
    expect(res.success, res.error).toBe(true);
    const finalArr = res.steps?.at(-1)?.array.map(e => e.value);
    expect(finalArr).toEqual([2, 4, 7, 9, 12]);
  });

  it('soporta macros #define con parámetros, casteos C/C++, memset, std::swap y std::reverse', () => {
    const code = `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

#define MENOR(a, b) ((a) < (b) ? (a) : (b))

int main() {
    int arr[] = { 8, 2, 5, 1 };
    int aux[4];
    memset(aux, 0, sizeof(aux));
    int m = static_cast<int>((0 + 3) / 2);
    if (MENOR(arr[3], arr[0]) == arr[3]) {
        std::swap(arr[0], arr[3]);
    }
    if (arr[2] < arr[1]) {
        swap(arr[1], arr[2]);
    }
    return m;
}`;

    const res = instrumentAndTraceStudentCode(code, [8, 2, 5, 1]);
    expect(res.success, res.error).toBe(true);
    const finalArr = res.steps?.at(-1)?.array.map(e => e.value);
    expect(finalArr).toEqual([1, 2, 5, 8]);
  });

  it('trunca automáticamente divisiones de punto medio (mid) e índices decimales en modo JavaScript', () => {
    const jsCode = `function busquedaBinariaJS(arr, n, target) {
  let low = 0;
  let high = n - 1;
  while (low <= high) {
    let mid = (low + high) / 2;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

function main() {
  let arr = [2, 5, 8, 12, 16, 23, 38, 45];
  return busquedaBinariaJS(arr, arr.length, 23);
}`;

    const res = instrumentAndTraceStudentCode(jsCode, [2, 5, 8, 12, 16, 23, 38, 45], 23);
    expect(res.success, res.error).toBe(true);
    expect(res.detectedLanguage).toBe('javascript');
    const foundStep = res.steps?.find(s => s.explanation.includes('(23) === 23 → Verdadero'));
    expect(foundStep).toBeDefined();
  });
});
