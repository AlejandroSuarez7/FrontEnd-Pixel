import { saleDTOAdapter } from '../adapters/saleDTOAdapter.js';
import { salesMockData } from '../mocks/salesMockData.js';
import { SaleRepository } from '../../domain/repositories/SaleRepository.js';

const STORAGE_KEY = 'pixel_sales_data';

export class SaleLocalStorageRepository extends SaleRepository {
  _loadRawData() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(salesMockData));
      return [...salesMockData];
    }
    try {
      return JSON.parse(raw) || [];
    } catch (error) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(salesMockData));
      return [...salesMockData];
    }
  }

  _saveRawData(records) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  async getAllSales() {
    const rawRecords = this._loadRawData();
    return rawRecords
      .map((record) => saleDTOAdapter.toEntity(record))
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
  }

  async getSaleById(id) {
    const rawRecords = this._loadRawData();
    const record = rawRecords.find((item) => item.id === id);
    return saleDTOAdapter.toEntity(record);
  }

  async saveSale(saleEntity) {
    const rawRecords = this._loadRawData();
    rawRecords.unshift(saleDTOAdapter.toDTO(saleEntity));
    this._saveRawData(rawRecords);
    return saleDTOAdapter.toEntity(rawRecords[0]);
  }

  async updateSale(saleEntity) {
    const rawRecords = this._loadRawData();
    const updatedRecords = rawRecords.map((record) =>
      record.id === saleEntity.id ? saleDTOAdapter.toDTO(saleEntity) : record
    );
    this._saveRawData(updatedRecords);
    return saleDTOAdapter.toEntity(
      updatedRecords.find((record) => record.id === saleEntity.id)
    );
  }
}
