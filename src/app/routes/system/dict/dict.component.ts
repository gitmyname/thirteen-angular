import { Component, OnInit } from '@angular/core';
import { NzMessageService, NzModalRef, NzModalService } from 'ng-zorro-antd';
import {DictEditComponent} from './dict-edit/dict-edit.component';
import {ResponseResultModel} from '../../../@core/net/response-result.model';
import {PagerResultModel} from '../../../@core/net/pager-result.model';
import {HttpParams} from '@angular/common/http';
import {DictService} from './dict.service';
import {GlobalConstants} from '../../../@core/constant/GlobalConstants';
import {DictModel} from './dict.model';
import { validatePerms } from '../../../@core/util/perms-validators';

@Component({
  selector: 'app-dict',
  templateUrl: './dict.component.html',
  styleUrls: ['./dict.component.scss']
})
export class DictComponent implements OnInit {

  /**
   * 全局常量
   */
  global: GlobalConstants = GlobalConstants.getInstance();

  /**
   * 查询参数
   */
  params: any = {
    code: '',
    name: '',
    isActive: ''
  };
  /**
   * 是否启用
   */
  isActives: any[] = [];
  /**
   * 当前页码
   */
  pageNum: number = 1;
  /**
   * 每页显示记录数
   */
  pageSize: number = 10;
  /**
   * 总记录数
   */
  total: number = 0;
  /**
   * 表格数据
   */
  tableData: DictModel[] = [];
  /**
   * 加载动画，默认关闭
   */
  loading = false;
  /**
   * 排序
   */
  sortMap = {
    code: null,
    name: null,
    is_active: null,
    create_time: 'desc',
    update_time: null
  };
  /**
   * 页面权限校验
   */
  perms = {
    save: false,
    update: false,
    delete: false
  };

  constructor(private dictService: DictService,
              private nzMessageService: NzMessageService,
              private modalService: NzModalService) {
  }

  ngOnInit() {
    this.perms = {
      save: validatePerms(['dict:save']),
      update: validatePerms(['dict:update']),
      delete: validatePerms(['dict:delete'])
    };
    this.isActives = [
      {text: '启用', value: this.global.ACTIVE_ON},
      {text: '禁用', value: this.global.ACTIVE_OFF}];
    this.list();
  }

  /**
   * 获取列表信息
   */
  list(): void {
    // 加载动画开启
    this.loading = true;
    const params = new HttpParams()
      .set('code', this.params.code)
      .set('name', this.params.name)
      .set('isActive', this.params.isActive)
      .set('pageSize', this.pageSize.toString())
      .set('pageNum', this.pageNum.toString())
      .set('orderBy', this.getOrderBy());
    this.dictService.list(params).subscribe((res: ResponseResultModel) => {
      // 判断返回结果是否为空或null
      if (res && res.result) {
        const result: PagerResultModel = res.result;
        this.tableData = result.list;
        this.total = result.total;
      }
      // 加载动画关闭
      this.loading = false;
    });
  }

  /**
   * 过滤方法
   *
   * @param isActive
   */
  filter(isActive: string): void {
    this.params.isActive = !!isActive ? isActive : '';
    this.list();
  }

  /**
   * 排序监听
   *
   * @param name
   * @param value
   */
  sort(name: string, value: string): void {
    for (const key of Object.keys(this.sortMap)) {
      if (key === name) {
        this.sortMap[key] = value;
      }
    }
    this.list();
  }

  /**
   * 获取排序参数
   */
  getOrderBy(): string {
    const arr = [];
    for (const key of Object.keys(this.sortMap)) {
      if (this.sortMap[key] != null) {
        // 注意是否有别称
        arr.push('d.' + key + ' ' + this.sortMap[key].replace('end', ''));
      }
    }
    return arr.toString();
  }

  /**
   * 打开新增页面
   */
  showSave() {
    const modal = this.openModel(this.global.INSERT_FLAG, '新增数据字典信息');

    // 模态框打开后回调事件
    modal.afterOpen.subscribe(() => console.log('[afterOpen] emitted!'));

    // 模态框关闭后回调事件
    modal.afterClose.subscribe((result) => {
      if (result && result.refresh) {
        // 刷新列表
        this.list();
      }
    });

    // 延时到模态框实例创建
    window.setTimeout(() => {
      const instance = modal.getContentComponent();
      instance.title = 'sub title is changed';
    }, 2000);
  }

  /**
   * 打开修改页面
   *
   * @param id 数据字典ID
   */
  showUpdate(id: string) {
    const modal = this.openModel(id, '修改数据字典信息');

    // 模态框打开后回调事件
    modal.afterOpen.subscribe(() => console.log('[afterOpen] emitted!'));

    // 模态框关闭后回调事件
    modal.afterClose.subscribe((result) => {
      if (result && result.refresh) {
        // 刷新列表
        this.list();
      }
    });
  }

  /**
   * 删除前确认
   *
   * @param id 用户ID
   */
  confirmDelete(id: string): void {
    this.deleteById(id);
  }

  /**
   * 取消删除事件回调
   */
  cancelDelete(): void {
    this.nzMessageService.info(this.global.DELETE_CANTER_MSG);
  }

  /**
   * 由ID删除数据字典信息
   *
   * @param id 数据字典ID
   */
  deleteById(id: string) {
    const msgId = this.nzMessageService.loading(this.global.DELETE_LOADING_MSG).messageId;
    this.dictService.deleteById(id).subscribe((res: ResponseResultModel) => {
      this.nzMessageService.remove(msgId);
      // 判断返回状态码是否为200（成功状态码）
      if (res.status === 200) {
        this.nzMessageService.success(this.global.DELETE_SUCESS_MSG);
      }
      this.list();
    });
  }

  /**
   * 打开模态框
   *
   * @param id 数据字典ID
   * @param title 模态框标题
   */
  openModel(id: string, title: string): NzModalRef {
    return this.modalService.create({
      nzTitle: title,
      nzContent: DictEditComponent,
      nzWidth: 600,
      nzComponentParams: {
        id: id
      },
      nzFooter: [
        {
          label: '返回',
          onClick: (componentInstance) => {
            componentInstance.destroyModal();
          }
        },
        {
          label: '提交',
          type: 'primary',
          onClick: (componentInstance) => {
            componentInstance.submitForm();
          }
        }
      ]
    });
  }

}
